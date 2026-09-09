const FLEX_VERSION='0.7.1';
const changelog=[
 {version:'0.7.1',name:'Navigation Space',date:'9 september 2026',items:['Profil borttagen från bottennavigationen · Profile removed from bottom navigation','Fyra huvudval får mer utrymme · Four primary destinations get more space','Profilen nås fortsatt via RM-knappen · Profile remains available through the RM button']},
 {version:'0.7.0',name:'Launch Experience',date:'9 september 2026',items:['Ny startscen med Flex-logotypen · New launch scene with the Flex logo','Mjuk övergång till appen · Smooth transition into the app','Anpassning för minskad rörelse · Reduced-motion support']},
 {version:'0.6.1',name:'Card & Profile Polish',date:'8 september 2026',items:['Hela demonstrationsbilden syns nu i övningskorten · Full demonstration images now fit inside exercise cards','Profilmarkeringen visar initialerna RM · The profile badge now shows the initials RM']},
 {version:'0.6.0',name:'App Identity',date:'8 september 2026',items:['Ny grön Flex-logotyp · New green Flex logo','Appikoner för iPhone och installerbar webbapp · App icons for iPhone and installable web app','Ny favicon och logotyp i toppfältet · New favicon and header logo']},
 {version:'0.5.0',name:'Navigation & Programs',date:'8 september 2026',items:['Ny navigation med fem riktiga appskärmar','Skapa, redigera och spara egna träningsprogram','Repetitioner eller tid per övning','Språkval och versionshistorik flyttade till Inställningar','Problemområden flyttade till skärmen Hjälp']},
 {version:'0.4.0',name:'The Bigger Library',date:'7 september 2026',items:['52 nya övningar inom 13 nya kategorier','Totalt 65 övningar','Rekommendationer efter smärta, stelhet och svaghet','Textkort för övningar utan bilder']},
 {version:'0.3.0',name:'Connected Movement',date:'6 september 2026',items:['Klickbara lättare och svårare variationer','Relaterade övningar efter muskelgrupp och position','Utzoomade thumbnails']},
 {version:'0.2.0',name:'Exercise Expansion',date:'5 september 2026',items:['Fler kategorier och övningar','Tre demonstrationsbilder per bildsatt övning','Listvy utan bilder','Alternativa övningsnamn']},
 {version:'0.1.0',name:'First Flex',date:'5 september 2026',items:['Första tvåspråkiga övningsbiblioteket','Sökning, filter och sparade övningar','Mobilanpassad webbapp']}
];

function goTo(screen,updateHash=true){
 document.querySelectorAll('.app-screen').forEach(el=>el.classList.toggle('active',el.dataset.screen===screen));
 document.querySelectorAll('.bottom-nav [data-go]').forEach(el=>el.classList.toggle('active',el.dataset.go===screen));
 if(updateHash)history.replaceState(null,'',`#${screen}`);
 window.scrollTo({top:0,behavior:'smooth'});
 if(screen==='programs')renderPrograms();
 if(screen==='home')renderHomePrograms();
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-go]');if(target){event.preventDefault();goTo(target.dataset.go)}});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key==='k')goTo('discover')},{capture:true});
window.addEventListener('hashchange',()=>goTo(location.hash.slice(1)||'home',false));
document.querySelector('.recommend-panels').addEventListener('click',event=>{if(event.target.closest('[data-recommend]'))goTo('discover')},{capture:true});

const changelogModal=document.querySelector('#changelogModal');
document.querySelector('#changelogButton').onclick=()=>{document.querySelector('#changelogList').innerHTML=changelog.map((release,index)=>`<section class="release ${index===0?'latest':''}"><div><b>v${release.version}</b>${index===0?'<span>Senaste</span>':''}</div><h3>${release.name}</h3><time>${release.date}</time><ul>${release.items.map(item=>`<li>${item}</li>`).join('')}</ul></section>`).join('');changelogModal.classList.add('open');changelogModal.setAttribute('aria-hidden','false');document.body.classList.add('body-locked')};
document.querySelectorAll('[data-changelog-close]').forEach(el=>el.onclick=()=>{changelogModal.classList.remove('open');changelogModal.setAttribute('aria-hidden','true');document.body.classList.remove('body-locked')});

let programs=JSON.parse(localStorage.getItem('flex-programs')||'[]');
let draft=[];
const builder=document.querySelector('#programBuilder'),programSearch=document.querySelector('#programSearch');
function openBuilder(program=null){draft=program?program.exercises.map(x=>({...x})):[];document.querySelector('#programName').value=program?.name||'Mitt träningspass';builder.dataset.editId=program?.id||'';builder.classList.add('open');programSearch.value='';renderProgramSearch();renderDraft()}
function closeBuilder(){builder.classList.remove('open')}
function renderProgramSearch(){const q=programSearch.value.trim().toLowerCase();const matches=data.filter(e=>!draft.some(d=>d.id===e.id)&&(!q||`${e.sv} ${e.en} ${e.cat}`.toLowerCase().includes(q))).slice(0,10);document.querySelector('#programSearchResults').innerHTML=matches.map(e=>`<button data-add-exercise="${e.id}"><span class="program-monogram">${e.sv.charAt(0)}</span><span><b>${e.sv}</b><small>${e.en} · ${e.cat}</small></span><i>+</i></button>`).join('')}
function renderDraft(){const grouped=Object.groupBy?Object.groupBy(draft,item=>data.find(e=>e.id===item.id)?.cat||'Övrigt'):draft.reduce((a,item)=>{const cat=data.find(e=>e.id===item.id)?.cat||'Övrigt';(a[cat]||=[]).push(item);return a},{});document.querySelector('#selectedCount').textContent=`${draft.length} övningar`;document.querySelector('#selectedExercises').innerHTML=draft.length?Object.entries(grouped).map(([cat,items])=>`<section class="draft-category"><h4>${cat}<span>${items.length} moment</span></h4>${items.map(item=>{const e=data.find(x=>x.id===item.id);return`<div class="draft-item"><span><b>${e.sv}</b><small>${e.en}</small></span><label><input type="number" min="1" max="999" value="${item.amount}" data-amount="${e.id}"><select data-unit="${e.id}"><option ${item.unit==='reps'?'selected':''} value="reps">reps</option><option ${item.unit==='sek'?'selected':''} value="sek">sek</option><option ${item.unit==='min'?'selected':''} value="min">min</option></select></label><button data-remove-exercise="${e.id}" aria-label="Ta bort">×</button></div>`}).join('')}</section>`).join(''):'<div class="draft-empty"><span>＋</span><b>Inga övningar ännu</b><p>Sök ovan och lägg till moment i programmet.</p></div>'}
function persistPrograms(){localStorage.setItem('flex-programs',JSON.stringify(programs));renderPrograms();renderHomePrograms()}
function programCard(program){const cats=[...new Set(program.exercises.map(item=>data.find(e=>e.id===item.id)?.cat).filter(Boolean))];return`<article class="program-card" data-program-id="${program.id}"><div class="program-card-top"><span>${program.exercises.length}</span><div><b>${program.name}</b><small>${program.exercises.length} övningar · ${cats.length} kategorier</small></div></div><div class="program-categories">${cats.map(cat=>`<span>${cat}</span>`).join('')}</div><ol>${program.exercises.slice(0,4).map(item=>{const e=data.find(x=>x.id===item.id);return`<li><span>${e?.sv||'Övning'}</span><b>${item.amount} ${item.unit}</b></li>`}).join('')}${program.exercises.length>4?`<li class="more">+ ${program.exercises.length-4} fler moment</li>`:''}</ol><div class="program-card-actions"><button data-edit-program="${program.id}">Redigera</button><button data-delete-program="${program.id}">Ta bort</button></div></article>`}
function renderPrograms(){document.querySelector('#programList').innerHTML=programs.length?programs.map(programCard).join(''):'<div class="no-programs"><span>▤</span><h3>Inga program ännu</h3><p>Skapa ditt första program och välj övningar från biblioteket.</p><button data-new-program>Skapa program</button></div>'}
function renderHomePrograms(){document.querySelector('#homePrograms').innerHTML=programs.length?programs.slice(0,2).map(programCard).join(''):'<button class="empty-program-preview" data-go="programs"><span>＋</span><div><b>Skapa ditt första program</b><small>Välj övningar och antal repetitioner</small></div><i>→</i></button>'}
document.querySelector('#newProgramButton').onclick=()=>openBuilder();document.querySelector('#closeBuilder').onclick=closeBuilder;programSearch.oninput=renderProgramSearch;
document.querySelector('#programSearchResults').onclick=event=>{const button=event.target.closest('[data-add-exercise]');if(!button)return;draft.push({id:button.dataset.addExercise,amount:10,unit:'reps'});renderProgramSearch();renderDraft()};
document.querySelector('#selectedExercises').oninput=event=>{if(event.target.dataset.amount){const item=draft.find(x=>x.id===event.target.dataset.amount);item.amount=Math.max(1,+event.target.value||1)}if(event.target.dataset.unit){draft.find(x=>x.id===event.target.dataset.unit).unit=event.target.value}};
document.querySelector('#selectedExercises').onclick=event=>{const button=event.target.closest('[data-remove-exercise]');if(!button)return;draft=draft.filter(x=>x.id!==button.dataset.removeExercise);renderProgramSearch();renderDraft()};
document.querySelector('#saveProgram').onclick=()=>{const name=document.querySelector('#programName').value.trim();if(!name){document.querySelector('#programName').focus();return}if(!draft.length){document.querySelector('#programSearch').focus();return}const editId=builder.dataset.editId;if(editId){const program=programs.find(x=>x.id===editId);program.name=name;program.exercises=draft}else{programs.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,exercises:draft,created:new Date().toISOString()})}persistPrograms();closeBuilder()};
document.querySelector('#programList').onclick=event=>{if(event.target.closest('[data-new-program]'))openBuilder();const edit=event.target.closest('[data-edit-program]');if(edit)openBuilder(programs.find(x=>x.id===edit.dataset.editProgram));const del=event.target.closest('[data-delete-program]');if(del){programs=programs.filter(x=>x.id!==del.dataset.deleteProgram);persistPrograms()}};
document.querySelector('#homePrograms').onclick=event=>{const card=event.target.closest('[data-program-id]');if(card){goTo('programs');openBuilder(programs.find(x=>x.id===card.dataset.programId))}};
renderPrograms();renderHomePrograms();goTo(location.hash.slice(1)||'home',false);

const splashScreen=document.querySelector('#splashScreen');
function dismissSplash(){if(!splashScreen||splashScreen.classList.contains('is-leaving'))return;splashScreen.classList.add('is-leaving');document.body.classList.remove('splash-active');window.setTimeout(()=>splashScreen.remove(),500)}
window.addEventListener('load',()=>window.setTimeout(dismissSplash,950),{once:true});
window.setTimeout(dismissSplash,2600);
