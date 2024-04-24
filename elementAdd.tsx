import React, { StrictMode, Component, ReactNode } from "react";
import './style.css';
import FeatDisplay from "./featDisplay";

class Feat {
	name : string;
	description: string;

	constructor(_name : string, _desc : string) {

		this.name = _name;
		this.description = _desc;
	}
}


interface ElementAddProps {
	all_feats :Feat[];
	level_plan: Feat[];
	butt_func_enq : Function;
	butt_func_deq : Function;

}

class ElementAddState {
	all_feats :Feat[];
	level_plan: Feat[];
	butt_func_enq : Function;
	butt_func_deq : Function;

	constructor(props : ElementAddProps) {
		this.all_feats = props.all_feats;
		this.level_plan = props.level_plan;
		this.butt_func_enq = props.butt_func_enq;
		this.butt_func_deq = props.butt_func_deq;
	}
}


class ElementAdd extends Component<ElementAddState,ElementAddProps> {



	constructor(props : ElementAddProps) {
		super(props);
		this.state = new ElementAddState(props);
	}

    componentDidUpdate(prevProps: ElementAddProps) {
        if (prevProps.level_plan !== this.props.level_plan) {
            this.setState({ level_plan: this.props.level_plan });
        }
    }

	override render(): ReactNode {

	const available_feats = this.state.all_feats.map(n_feat => <FeatDisplay feat={n_feat} butt_func={this.state.butt_func_enq} status={2}></FeatDisplay>)
	let planned = this.state.level_plan.map(n_feat => <FeatDisplay feat={n_feat} butt_func={this.state.butt_func_deq} status={1}></FeatDisplay>)
	console.log("This my guys:");
	console.log(this.state);

	if(this.state.level_plan.length == 0) {
		return <div>
				<div id="levelup" className="jojoe" style={{float:"right",width:"20%",position:"fixed",top:"10px",right:"10px"}}> 
				<h3 style={{marginTop:"0",paddingTop:"0"}}>Level Up Guy:</h3>   
				


				<div className="container" style={{height:"280px",overflow:"auto"}}><div id="header" style={{height:"5%"}}>            
				</div>
					<b><i>Available Elements:</i></b>
					<hr></hr>
					<div id="level_abilities">
						{available_feats}
					</div>
				</div>
				<div className="container">
					<div id="header" style={{height:"5%"}}></div>
					<b><i>Level Planner:</i></b>
					<hr></hr>
					<div id="level_planner">
						<p>Add up to 2 abilities per level, 3 for the initial bonus!</p>
					</div>
				</div>
			</div>
		</div>
	} else {
		return <div>
				<div id="levelup" className="jojoe" style={{float:"right",width:"20%",position:"fixed",top:"10px",right:"10px"}}> 
				<h3 style={{marginTop:"0",paddingTop:"0"}}>Level Up Guy:</h3>   
				


				<div className="container" style={{height:"280px",overflow:"auto"}}><div id="header" style={{height:"5%"}}>            
				</div>
					<b><i>Available Elements:</i></b>
					<hr></hr>
					<div id="level_abilities">
						{available_feats}
					</div>
				</div>
				<div className="container">
					<div id="header" style={{height:"5%"}}></div>
					<b><i>Level Planner:</i></b>
					<hr></hr>
					<div id="level_planner">
						{planned}
					</div>
				</div>
			</div>
		</div>

	}

	
	}
}

export default ElementAdd