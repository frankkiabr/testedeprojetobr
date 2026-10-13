import { describe, expect, it } from 'vitest';
import { plans } from '@/lib/frankkia-data';
describe('Frankkia monthly plans',()=>{
 it('Equipe 15 allows 15 brokers at R$ 999 monthly',()=>{expect(plans.find(p=>p.name==='Equipe 15')).toEqual({name:'Equipe 15',brokers:15,price:999});});
 it('Equipe 30 allows 30 brokers at R$ 1.799 monthly',()=>{expect(plans.find(p=>p.name==='Equipe 30')).toEqual({name:'Equipe 30',brokers:30,price:1799});});
 it('Equipe 60 allows 60 brokers at R$ 2.999 monthly',()=>{expect(plans.find(p=>p.name==='Equipe 60')).toEqual({name:'Equipe 60',brokers:60,price:2999});});
 it('Equipe 100 allows 100 brokers at R$ 4.499 monthly',()=>{expect(plans.find(p=>p.name==='Equipe 100')).toEqual({name:'Equipe 100',brokers:100,price:4499});});
});
