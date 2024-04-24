import React, { StrictMode, Component, ReactNode } from "react";
//import C_Feat from './c_defs'

class Feat {
	name : string;
	description: string;

	constructor(_name : string, _desc : string) {

		this.name = _name;
		this.description = _desc;
	}
}

interface FeatProps {
	feat : Feat;
	status: number;
	butt_func : Function;
}

class FeatState {
	feat : Feat;
	status: number = 0;
	butt_func : Function;

	constructor(props : FeatProps) {
		this.feat = props.feat;
		this.status = props.status
		this.butt_func = props.butt_func;
	}
}

class FeatDisplay extends Component<FeatProps, FeatState> {
	

	constructor(props : FeatProps) {
		super(props);
		this.state = new FeatState(props);
		}

	override render(): ReactNode {

	let myButt = <button onClick={() => this.state.butt_func(this.state.feat)} type="button" className="butt stack_right" style={{backgroundColor:"purple"}}><b title="Enact Action">🗡</b></button>
	if(this.state.status == 1) {
		myButt = <button onClick={() => this.state.butt_func(this.state.feat)} type="button" className="butt stack_right" style={{backgroundColor:"red"}}><b title="Remove">★</b></button>
	} else if(this.state.status == 2) {
		myButt = <button onClick={() => this.state.butt_func(this.state.feat)} type="button" className="butt stack_right" style={{backgroundColor:"green"}}><b title="Add">➕</b></button>
	}

	return <div className="blackbox">
		{myButt}
		<b>{this.state.feat.name}</b>
		<hr></hr>
		<p>{this.state.feat.description}</p>
	</div>
	}
}

export default FeatDisplay