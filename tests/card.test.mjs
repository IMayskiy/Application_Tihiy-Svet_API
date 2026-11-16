import {test} from 'node:test';
import assert from 'node:assert/strict';
import OpenAI from 'openai';
import {buildCard} from '../card.mjs';
const base={product:'Луна 01',color:'белый',quantity:12,budget_rub:60000,desired_date_text:'20 ноября',contact:null,delivery_address:null,missing_fields:[],status:'ready_for_review'};
function transport(result,inspect=()=>{}){return new OpenAI({apiKey:'test-only',maxRetries:0,fetch:async(_url,opts)=>{inspect(JSON.parse(opts.body));return new Response(JSON.stringify({id:'resp_test',object:'response',model:'test-model',...result}),{status:200,headers:{'content-type':'application/json'}})}})}
function complete(card){return {status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(card),annotations:[]}]}]}}
test('полный текст и строгая схема',async()=>{const result=await buildCard(transport(complete(base),body=>{assert.equal(body.text.format.type,'json_schema');assert.equal(body.text.format.strict,true);assert.equal(body.text.format.schema.additionalProperties,false);assert.equal(body.text.format.schema.required.length,9);assert.equal(body.store,false)}),'test-model','пример');assert.equal(result.card.quantity,12);assert.equal(result.card.desired_date_text,'20 ноября');assert.deepEqual(result.card.missing_fields,['Контакт','Точный адрес доставки']);assert.equal(result.card.status,'needs_clarification');assert.equal(result.raw.status,'ready_for_review')});
test('отсутствует бюджет',async()=>{const x=await buildCard(transport(complete({...base,budget_rub:null})),'test','x');assert.ok(x.card.missing_fields.includes('Бюджет'))});
test('отрицательное количество',async()=>{await assert.rejects(buildCard(transport(complete({...base,quantity:-1})),'test','x'),e=>e.kind==='validation')});
test('отказ',async()=>{await assert.rejects(buildCard(transport({status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'no'}]}]}),'test','x'),e=>e.kind==='refusal')});
test('незавершённый ответ',async()=>{await assert.rejects(buildCard(transport({status:'incomplete',output:[] }),'test','x'),e=>e.kind==='incomplete')});
test('лишние поля и отрицательный бюджет',async()=>{await assert.rejects(buildCard(transport(complete({...base,extra:true})),'test','x'),e=>e.kind==='schema');await assert.rejects(buildCard(transport(complete({...base,budget_rub:-1})),'test','x'),e=>e.kind==='validation')});

test('null и дробное количество обрабатываются отдельно',async()=>{const x=await buildCard(transport(complete({...base,quantity:null,budget_rub:null})),'test','x');assert.equal(x.card.quantity,null);assert.equal(x.card.budget_rub,null);await assert.rejects(buildCard(transport(complete({...base,quantity:1.5})),'test','x'),e=>e.kind==='validation')});
