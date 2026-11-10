export function calculate({age,sex,weight,height,activity,goal}) {
 if(![age,weight,height,activity].every(Number.isFinite)||age<18||age>100||weight<35||weight>300||height<130||height>230||!['male','female'].includes(sex)||![1.2,1.375,1.55,1.725].includes(activity)||!['loss','maintain','gain'].includes(goal)) throw new Error('Please check your details. Supported ranges: age 18–100, weight 35–300 kg and height 130–230 cm.');
 const resting=10*weight+6.25*height-5*age+(sex==='male'?5:-161);
 const maintenance=resting*activity;
 const target=maintenance*({loss:.85,maintain:1,gain:1.05}[goal]);
 const bmi=weight/(height/100)**2;
 const caution=bmi<18.5?'Your weight is low for your height. A personalised assessment is more useful than an automatic calorie target.':target<(sex==='male'?1500:1200)?'This calculation produces a low intake. Please get personalised advice rather than using an automatic target.':null;
 return {resting,maintenance:Math.round(maintenance/50)*50,target:Math.round(target/50)*50,caution};
}
export function toMetric(weight,height,inches,units){return units==='imperial'?{weight:weight*.45359237,height:(height*12+inches)*2.54}:{weight,height};}
