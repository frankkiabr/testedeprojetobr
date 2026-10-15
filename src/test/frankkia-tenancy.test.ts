// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

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
  expect(runSql(`${fixture} SELECT public.assert_capacity('${org}'); SELECT count(*) FROM public.memberships m JOIN public.membership_roles r ON r.membership_id=m.id WHERE m.organization_id='${org}' AND r.role='broker' AND m.status='active';`).split('\n').at(-1)).toBe('0');
 });
 it('supports administrator and broker in the same membership', () => {
  expect(runSql(`${fixture} INSERT INTO public.membership_roles VALUES('${adminMember}','broker'); SELECT count(*) FROM public.membership_roles WHERE membership_id='${adminMember}';`).split('\n').at(-1)).toBe('2');
 });
 it('supports two organizations for one user', () => {
  expect(runSql(`${fixture} INSERT INTO public.memberships(organization_id,user_id) VALUES('${other}','${admin}'); SELECT count(*) FROM public.memberships WHERE user_id='${admin}';`).split('\n').at(-1)).toBe('2');
 });
 it('blocks administrators from changing their own status or roles', () => {
  expect(denied(`SET LOCAL ROLE authenticated; SELECT pg_temp.must_fail($q$SELECT public.manage_membership('${adminMember}','inactive',ARRAY['broker'])$q$);`)).toBe('denied');
 });
 it('blocks direct membership writes by authenticated clients', () => {
  expect(denied(`SET LOCAL ROLE authenticated; SELECT pg_temp.must_fail($q$UPDATE public.memberships SET status='inactive' WHERE id='${adminMember}'$q$);`)).toBe('denied');
 });
 it('protects the last active administrator', () => {
  expect(denied(`SELECT pg_temp.must_fail($q$DELETE FROM public.membership_roles WHERE membership_id='${adminMember}' AND role='admin'$q$);`)).toBe('denied');
 });
 it('isolates organizations by active membership', () => {
  expect(runSql(`${fixture} SET LOCAL ROLE authenticated; SELECT count(*) FROM public.organizations WHERE id='${other}';`).split('\n').at(-1)).toBe('0');
 });
 it('does not expose other membership records to brokers', () => {
  expect(runSql(`${fixture} INSERT INTO public.memberships(organization_id,user_id) VALUES('${org}','${user}'); INSERT INTO public.membership_roles SELECT id,'broker' FROM public.memberships WHERE user_id='${user}'; SELECT set_config('request.jwt.claim.sub','${user}',true); SET LOCAL ROLE authenticated; SELECT count(*) FROM public.memberships WHERE user_id='${admin}';`).split('\n').at(-1)).toBe('0');
 });
 it('rejects ordinary global superadministrator grants', () => {
  expect(denied(`SET LOCAL ROLE authenticated; SELECT pg_temp.must_fail($q$INSERT INTO public.user_roles(user_id,role) VALUES('${admin}','superadmin')$q$);`)).toBe('denied');
 });
 it('rejects superadministrator role in an ordinary invitation', () => {
  expect(denied(`SELECT pg_temp.must_fail($q$SELECT public.reserve_invitation('${org}','test@example.invalid',ARRAY['superadmin'],repeat('a',64),now()+interval '1 day')$q$);`)).toBe('denied');
 });
 it('counts fifteen reserved broker invitations and rejects the sixteenth', () => {
  const hash = randomUUID().replaceAll('-','');
  expect(denied(`SELECT public.reserve_invitation('${org}','seat'||n||'@example.invalid',ARRAY['broker'],md5('${hash}'||n)||md5(n::text),now()+interval '1 day') FROM generate_series(1,15)n;
SELECT pg_temp.must_fail($q$SELECT public.reserve_invitation('${org}','seat16@example.invalid',ARRAY['broker'],repeat('f',64),now()+interval '1 day')$q$);`)).toBe('denied');
 });
 it('rejects expired invitations', () => {
  expect(denied(`SELECT pg_temp.must_fail($q$SELECT public.reserve_invitation('${org}','expired@example.invalid',ARRAY['broker'],repeat('b',64),now()-interval '1 minute')$q$);`)).toBe('denied');
 });
 it('prevents an administrator from inviting into another organization', () => {
  expect(denied(`SET LOCAL ROLE authenticated; SELECT pg_temp.must_fail($q$SELECT public.reserve_invitation('${other}','other@example.invalid',ARRAY['admin'],repeat('c',64),now()+interval '1 day')$q$);`)).toBe('denied');
 });
 it('keeps invitation hashes unreadable to authenticated clients', () => {
  expect(denied(`SET LOCAL ROLE authenticated; SELECT pg_temp.must_fail($q$SELECT token_hash FROM public.invitations$q$);`)).toBe('denied');
 });
 it('records administrative invitation revocation', () => {
  expect(runSql(`${fixture} SELECT public.reserve_invitation('${org}','revoked@example.invalid',ARRAY['admin'],repeat('d',64),now()+interval '1 day'); SELECT public.revoke_invitation(id) FROM public.invitations WHERE organization_id='${org}'; SELECT count(*) FROM public.audit_logs WHERE organization_id='${org}' AND action='invitation.revoked';`).split('\n').at(-1)).toBe('1');
 });
});