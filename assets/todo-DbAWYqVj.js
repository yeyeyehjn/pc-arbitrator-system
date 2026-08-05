import{a5 as p,r as c,l as m}from"./index-DS_v_MTH.js";const n=(e,a={})=>({caseNo:`(2026)沪仲第${String(1e3+e).padStart(4,"0")}号`,caseReason:["买卖合同纠纷","股权转让纠纷","建设工程施工合同纠纷","借款合同纠纷","房屋租赁合同纠纷"][e%5],applicant:["上海宏图贸易有限公司","李明华","北京科瑞科技有限公司","王秀英","深圳市鹏程建筑集团"][e%5],respondent:["上海远东物流有限公司","张伟强","北京恒盛投资集团","陈建国","深圳市宏基建材有限公司"][e%5],amount:[12e5,58e4,35e5,86e3,42e5][e%5],secretary:["刘秘书","陈秘书","王秘书","赵秘书","周秘书"][e%5],tribunal:["张三","张三、李四、王五","李四","王五、张三、赵六"][e%4],caseStatus:["审理中","已组庭","待开庭","审理中","已开庭"][e%5],submitTime:`2026-07-${String(10+e).padStart(2,"0")} 09:30`,...a}),L=p("todo",()=>{const e=c([{id:"c1",...n(0,{docTitle:"仲裁员声明承诺书",content:"本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定，秉公裁决，不徇私情……（承诺书正文略）"})},{id:"c2",...n(2,{docTitle:"仲裁员声明承诺书",content:"本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定，秉公裁决……"})},{id:"c3",...n(4,{docTitle:"仲裁员声明承诺书",content:"本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定……"})}]),a=c([{id:"r1",...n(1,{docTitle:"开庭笔录（第一次）",content:`时间：2026年7月15日 上午9:30
地点：第三仲裁庭
申请人：上海宏图贸易有限公司
被申请人：上海远东物流有限公司
……（笔录正文略）`})},{id:"r2",...n(3,{docTitle:"开庭笔录（第一次）",content:`时间：2026年7月14日 下午14:00
地点：第一仲裁庭
……`})}]),l=c([{id:"d1",...n(0,{docTitle:"案件受理通知书"})},{id:"d2",...n(2,{docTitle:"组庭通知书"})}]),s=c([{id:"e1",...n(0),groupDate:"2026-06-15",deadline:"2026-09-15",remainDays:62,isSuspended:!1,extensionCount:1,extensionReason:"因申请人需补充关键证据材料，申请延期 30 天",extensionDays:30},{id:"e2",...n(2),groupDate:"2026-05-20",deadline:"2026-08-20",remainDays:36,isSuspended:!0,extensionCount:2,extensionReason:"被申请人提出管辖权异议，正在处理中，申请延期 45 天",extensionDays:45}]),r=c([{id:"ch1",...n(1),groupDate:"-",deadline:"待组庭",remainDays:"-",isSuspended:!1,extensionCount:0},{id:"ch2",...n(4),groupDate:"-",deadline:"待组庭",remainDays:"-",isSuspended:!1,extensionCount:0}]),d=c([{id:"rv1",...n(0),submitter:"刘秘书",awardContent:`上海仲裁委员会裁决书

(2026)沪仲第1000号

申请人：上海宏图贸易有限公司……
被申请人：上海远东物流有限公司……

经审理查明：……（裁决书正文略）

裁决如下：
一、被申请人向申请人支付货款人民币120万元；
二、仲裁费用由被申请人承担。`}]),u=m(()=>({signature:e.value.length+a.value.length+l.value.length,center:s.value.length+r.value.length,review:d.value.length}));return{commitmentList:e,recordList:a,documentList:l,extensionList:s,chiefList:r,reviewList:d,counts:u,fetchAllCounts:()=>u.value,signCommitment:t=>{e.value=e.value.filter(o=>o.id!==t)},signRecord:t=>{a.value=a.value.filter(o=>o.id!==t)},signDocument:t=>{l.value=l.value.filter(o=>o.id!==t)},approveExtension:(t,o)=>{s.value=s.value.filter(i=>i.id!==t)},approveBatch:(t,o)=>{const i=new Set(t);s.value=s.value.filter(v=>!i.has(v.id))},selectChief:(t,o)=>{r.value=r.value.filter(i=>i.id!==t)},reviewAward:(t,o)=>{d.value=d.value.filter(i=>i.id!==t)}}});export{L as u};
