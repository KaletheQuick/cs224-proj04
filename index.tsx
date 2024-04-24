
import React, { StrictMode, Component, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import CharSheet from './charSheet';
import ElementAdd from "./elementAdd";
import './style.css';
//import Feat from './featDisplay'

class Feat {
	name : string;
	description: string;

	constructor(_name : string, _desc : string) {

		this.name = _name;
		this.description = _desc;
	}
}

const feats = [
	new Feat("Deft Hands", "Your skilled hands can tie knots and pick pockets."),
	new Feat("Ferocity", "Once a day when you pass below 0 HP, you stay stable as if you were at 0 hp."),
	new Feat("Stability", "Once a day you may rest for 4 hours and recover 1 hp"),
	new Feat("Mastier", "You can stomach most any food, and this has allowed you to experience a diversity of culture. +2 to diplomacy"),
	new Feat("Milkdrinker", "You can drink the milk of most mammilian creatures. +1 survival."),
	new Feat("Insomnia", "You have difficulty falling asleep. (Other name Reverie, forgotten realms elf meditation). +2 to saves vs sleep"),
	new Feat("Keen Vision", "You can see why kids like cinnamon toast crunch. Your feeble mind cannot conprihend it's nuance. +2 to perception for sight"),
	new Feat("Grand Versatility", "+1 general floating slot."),
	new Feat("Demon tail", "You have a large demon tail. It has no functional use, it's more object oriented."),
	new Feat("Hunger for Flesh", "You have a hunger for the flesh of creatures like you. Every day you do not consume it, the will DC to not get some goes up by 5"),
	new Feat("Fireslash", "You can focus a portion of your elemental bieng into a short range attack. 1d4+(con) fire damage."),
	new Feat("Soul Sight", "You can see all living and undead within 10 ft with a DC 10 will save. Not mechanical or construct. You can see the imprint left by souls and soul like things (undead animus). But that imprint is invariant to time. "),
	new Feat("Fireskin", "Your flesh is a thing of flame, granting a low level fire resitance. Fire Resit +2"),
	new Feat("Combat level", "You are well versed in the general philophipies of combat on a personal level. +1 BAB"),
	new Feat("Caster level", "You are capable of focusing and channeling magical energy in a general capacity. +1 Caster Level"),
	new Feat("Social Level", "You have a broad understanding of social milieu and adaptability. +1 Social Level"),
]


interface AppProps {
	character : Feat[][];
	proposed_level : Feat[];
}

class AppState {
	public character : Feat[][];
	public proposed_level : Feat[];

	constructor(){//props : AppProps) {
		//this.character = props.character;
		//this.proposed_level = props.proposed_level;
		this.character = [];
		this.proposed_level = [];
	}
}


class App extends Component<AppState, AppProps> {

	constructor(props : AppProps) {
		super(props);
		let n_state = new AppState();
		n_state.character = props.character;
		n_state.proposed_level = props.proposed_level;
		this.state = n_state;
/* 		let start_char = [feats[8],feats[7],feats[6]],
		[feats[5],feats[4]],
		[feats[10],feats[11]];
		let pro_lvl : Feat[] = []
		this.state = new AppState(start_char, pro_lvl); 
		
		
		this.character = [
		[feats[8],feats[7],feats[6]],
		[feats[5],feats[4]],
		[feats[10],feats[11]]
	]
	this.proposed_level = [feats[0],feats[15]];
	*/
	}



feat_use = (feat : Feat) => {
	alert("Player used their "+ feat.name +" ability");
}

feat_enqueue = (feat : Feat) => {
	if (this.state.character.length > 0) {
		if (this.state.proposed_level.length >= 2){return;}
	} else {
		if (this.state.proposed_level.length >= 3){return;}		
	}
	//alert("Pretend we added this to the level plan: "+ feat.name);
	let new_q : Feat[] = [];
	for (let index = 0; index < this.state.proposed_level.length; index++) {
		const element = this.state.proposed_level[index];
		console.log(element.name);
		if(element.name == feat.name) {
			alert("Feat does not allow duplicates");
			return;
		}			
		new_q.push(element);
	}
	new_q.push(feat);
	this.state.proposed_level.push(feat);
	let n_state = new AppState();
	n_state.character = this.state.character;
	n_state.proposed_level = new_q;
	this.setState(n_state);
	//this.forceUpdate();
	console.log(this.state);
	
}
feat_dequeue = (feat : Feat) => {
	//alert("Pretend we removed this from the level plan: "+ feat.name);
 	let malcom = []
	 console.log(this.state.proposed_level);
	for (let index = 0; index < this.state.proposed_level.length; index++) {
		const element = this.state.proposed_level[index];
		if(element.name != feat.name) {
			malcom.push(element);
			console.log("one down");
		}			
	}
	let n_state = new AppState();
	n_state.character = this.state.character;
	n_state.proposed_level = malcom;
	this.setState(n_state);
	console.log("~~~~")
	this.forceUpdate();
	console.log(this.state);
	
}

apply_planned_level = () => {
	let char = this.state.character;
	char.push(this.state.proposed_level);
	let n_state = new AppState();
	n_state.character = char;
	n_state.proposed_level = [];
	this.setState(n_state);
}

reset_char = () => {
	let n_state = new AppState();
	n_state.character = [];
	n_state.proposed_level = [];
	this.setState(n_state);

}

	override render(): ReactNode {
	return <div>
		<button className="butt" onClick={this.apply_planned_level}>Apply planned level</button>
		<button className="butt" onClick={this.reset_char}>Reset Charachter</button>
		<div style={{width:"max-content",margin:"auto"}}><CharSheet char_name="Fumbles" levels={this.state.character} butt_func={this.feat_use}></CharSheet></div>
		<ElementAdd all_feats={feats} level_plan={this.state.proposed_level} butt_func_deq={this.feat_dequeue} butt_func_enq={this.feat_enqueue}></ElementAdd>

		
		</div>
	}
}

const rootElem = document.getElementById('root');
if( rootElem == null ) {
alert('you forgot to put a root element in your HTML file.');
}
let character = [
	[feats[8],feats[7],feats[6]],
	[feats[5],feats[4]],
	[feats[10],feats[11]]
]
let proposed_level = [feats[0],feats[15]];
const root = createRoot( rootElem as HTMLElement );
root.render(
<StrictMode>
<App character={[]} proposed_level={[]}/>
</StrictMode>
);