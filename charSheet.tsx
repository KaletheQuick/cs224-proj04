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


interface CharSheetProps {
	char_name : string;
	levels :Feat[][];
	butt_func : Function;

}

class CharSheetState {
	char_name: string = "Fumbles";	
	levels : Feat[][];
	butt_func : Function;

	constructor(props : CharSheetProps) {
		this.char_name = props.char_name;
		this.levels = props.levels; 
		this.butt_func = props.butt_func;
	}
}


class CharSheet extends Component<CharSheetProps,CharSheetState> {


	constructor(props : CharSheetProps) {
		super(props);
		this.state = new CharSheetState(props);
	}

    componentDidUpdate(prevProps: CharSheetProps) {
        if (prevProps.levels !== this.props.levels) {
            this.setState({ levels: this.props.levels });
        }
    }
	override render(): ReactNode {

		if(this.state.levels.length == 0) {
			return  <div className="container clearfix">
			<h1 id="char_name">{this.state.char_name}</h1>
			<h2 id="subscript">Level your Character</h2>
			<div className="container shield" id="area_hitPoints" style={{float:"right",margin:"auto"}}><b><i>hp</i></b><sub>/HP</sub></div>
			<div>
				<div id="statsArea" className="nun" style={{float:"left",margin:"auto",padding:"10px"}}>
				</div>
				<div id="skillArea" className="nun" style={{float:"left",margin:"auto",padding:"10px"}}>
				</div>
				<div id="featArea" className="nun" style={{float:"left",margin:"auto",padding:"10px"}}>
					<h2>Pick abilities for a starting bonus, then pick abilities for levels.</h2>
					<h3>Buttons to apply a planned level, or reset the character are to the left.</h3>
				</div>
			</div>
		</div>
		}

		const level_readout = []
		for (let index = 0; index < this.state.levels.length; index++) {
			const element = this.state.levels[index] as Feat[];			
			const result = element.map(feat => <FeatDisplay feat={feat} butt_func={this.state.butt_func} status={0}></FeatDisplay>)
			
			if(index == 0) {
				level_readout.push(
					<div>
					<h3>Bonus</h3>
					<hr></hr>
						{result}
					</div>
				);
			} else {
				level_readout.push(
					<div>
					<h3>Level {index}</h3>
					<hr></hr>
						{result}
					</div>
				);
			}
		}

	return <div className="container clearfix">
		<h1 id="char_name">{this.state.char_name}</h1>
		<h2 id="subscript">Level {this.state.levels.length - 1} Charachter</h2>
		<div className="container shield" id="area_hitPoints" style={{float:"right",margin:"auto"}}><b><i>hp</i></b><sub>/HP</sub></div>
		<div>
			<div id="statsArea" className="nun" style={{float:"left",margin:"auto",padding:"10px"}}>
			</div>
			<div id="skillArea" className="nun" style={{float:"left",margin:"auto",padding:"10px"}}>
			</div>
			<div id="featArea" className="nun" style={{float:"left",margin:"auto",padding:"10px"}}>
				{level_readout}
			</div>
		</div>
	</div>
	}
}

export default CharSheet