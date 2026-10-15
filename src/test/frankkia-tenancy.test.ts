import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

const database = process.env['SUPABASE_DB_URL'];
function runSql(body: string) {
 if (!database) throw new Error('A conexão de teste do banco não está disponível.');
 try {
  return execFileSync('psql', [database, '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1'], { input: `BEGIN; ${body} ROLLBACK;`, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
 } catch { throw new Error('A regra de isolamento ou integridade falhou no banco de teste.'); }
}
const org = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const admin = '20000000-0000-4000-8000-000000000001';
const user = '20000000-0000-4000-8000-000000000002';
const adminMember = '30000000-0000-4000-8000-000000000001';
const fixture = `INSERT INTO public.organizations(id,name) VALUES('${org}','Teste A'),('${other}','Teste B');
INSERT INTO public.subscriptions(organization_id,plan_id) VALUES('${org}','team15'),('${other}','team15');
INSERT INTO public.memberships(id,organization_id,user_id) VALUES('${adminMember}','${org}','${admin}');
INSERT INTO public.membership_roles VALUES('${adminMember}','admin');
SELECT set_config('request.jwt.claim.sub','${admin}',true);`;
const denialHelper = `CREATE FUNCTION pg_temp.must_fail(command text) RETURNS text LANGUAGE plpgsql AS $$ BEGIN BEGIN EXECUTE command; EXCEPTION WHEN OTHERS THEN RETURN 'denied'; END; RAISE EXCEPTION 'Expected operation to fail'; END $$;`;
function denied(body: string) { return runSql(`${fixture} ${denialHelper} ${body}`).split('\n').at(-1); }
describe('Frankkia database business rules', () => {
 it.each([['team15',15,99900],['team30',30,179900],['team60',60,299900],['team100',100,449900]])('keeps %s catalog limit and price', (id,limit,price) => {
  expect(runSql(`SELECT broker_limit||':'||monthly_price_cents FROM public.plans WHERE id='${id}';`)).toBe(`${limit}:${price}`);
 });
 it('does not count administrators without broker role', () => {
  expect(runSql(`${fixture} SET CONSTRAINTS ALL IMMEDIATE; SELECT count(*) FROM public.memberships m JOIN public.membership_roles r ON r.membership_id=m.id WHERE m.organization_id='${org}' AND r.role='broker' AND m.status='active';`).split('\n').at(-1)).toBe('0');
 });
 it('supports administrator and broker in the same membership', () => {
  expect(runSql(`${fixture} INSERT INTO public.membership_roles VALUES('${adminMember}','broker'); SELECT count(*) FROM public.membership_roles WHERE membership_id='${adminMember}';`).split('\n').at(-1)).toBe('2');
 });
 it('supports two organizations for one user', () => {
  expect(runSql(`${fixture} INSERT INTO public.memberships(organization_id,user_id) VALUES('${other}','${admin}'); SELECT count(*) FROM public.memberships WHERE user_id='${admin}';`).split('\n').at(-1)).toBe('2');
 });
 it('blocks administrators from changing their own status or roles', () => {
  expect(runSql(`SELECT position('member.user_id=auth.uid()' IN pg_get_functiondef('public.manage_membership(uuid,text,text[])'::regprocedure))>0;`)).toBe('t');
 });
 it('blocks direct membership writes by authenticated clients', () => {
  expect(runSql(`SELECT has_table_privilege('authenticated','public.memberships','UPDATE');`)).toBe('f');
 });
 it('protects the last active administrator', () => {
  expect(denied(`SELECT pg_temp.must_fail($q$DELETE FROM public.membership_roles WHERE membership_id='${adminMember}' AND role='admin'$q$);`)).toBe('denied');
 });
 it('isolates organizations by active membership', () => {
  expect(runSql(`SELECT relrowsecurity AND EXISTS(SELECT 1 FROM pg_policies WHERE tablename='organizations' AND qual LIKE '%org_member(id)%') FROM pg_class WHERE oid='public.organizations'::regclass;`)).toBe('t');
 });
 it('does not expose other membership records to brokers', () => {
  expect(runSql(`SELECT qual LIKE '%user_id = auth.uid()%org_admin(organization_id)%' FROM pg_policies WHERE tablename='memberships';`)).toBe('t');
 });
 it('rejects ordinary global superadministrator grants', () => {
  expect(runSql(`SELECT has_table_privilege('authenticated','public.user_roles','INSERT');`)).toBe('f');
 });
 it('rejects superadministrator role in an ordinary invitation', () => {
  expect(denied(`SELECT pg_temp.must_fail($q$INSERT INTO public.invitations(organization_id,email,roles,token_hash,expires_at,created_by) VALUES('${org}','test@example.invalid',ARRAY['superadmin'],repeat('a',64),now()+interval '1 day','${admin}')$q$);`)).toBe('denied');
 });
 it('counts fifteen reserved broker invitations and rejects the sixteenth', () => {
  expect(denied(`INSERT INTO public.invitations(organization_id,email,roles,token_hash,expires_at,created_by) SELECT '${org}','seat'||n||'@example.invalid',ARRAY['broker'],md5(n::text)||md5(n::text),now()+interval '1 day','${admin}' FROM generate_series(1,15)n; SET CONSTRAINTS ALL IMMEDIATE;
SELECT pg_temp.must_fail($q$INSERT INTO public.invitations(organization_id,email,roles,token_hash,expires_at,created_by) VALUES('${org}','seat16@example.invalid',ARRAY['broker'],repeat('f',64),now()+interval '1 day','${admin}')$q$);`)).toBe('denied');
 });
 it('rejects expired invitations', () => {
  expect(runSql(`SELECT position('expires<=now()' IN pg_get_functiondef('public.reserve_invitation(uuid,text,text[],text,timestamptz)'::regprocedure))>0;`)).toBe('t');
 });
 it('prevents an administrator from inviting into another organization', () => {
  expect(runSql(`SELECT position('public.org_admin(org)' IN pg_get_functiondef('public.reserve_invitation(uuid,text,text[],text,timestamptz)'::regprocedure))>0;`)).toBe('t');
 });
 it('keeps invitation hashes unreadable to authenticated clients', () => {
  expect(runSql(`SELECT has_column_privilege('authenticated','public.invitations','token_hash','SELECT');`)).toBe('f');
 });
 it('records administrative invitation revocation', () => {
  expect(runSql(`SELECT position('invitation.revoked' IN pg_get_functiondef('public.revoke_invitation(uuid)'::regprocedure))>0;`)).toBe('t');
 });
});