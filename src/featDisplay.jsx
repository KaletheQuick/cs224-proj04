import React, { Component } from "react";
//import C_Feat from './c_defs'
class Feat {
    constructor(_name, _desc) {
        this.name = _name;
        this.description = _desc;
    }
}
class FeatState {
    constructor(props) {
        this.status = 0;
        this.feat = props.feat;
        this.status = props.status;
        this.butt_func = props.butt_func;
    }
}
class FeatDisplay extends Component {
    constructor(props) {
        super(props);
        this.state = new FeatState(props);
    }
    render() {
        let myButt = <button onClick={() => this.state.butt_func(this.state.feat)} type="button" className="butt stack_right" style={{ backgroundColor: "purple" }}><b title="Enact Action">🗡</b></button>;
        if (this.state.status == 1) {
            myButt = <button onClick={() => this.state.butt_func(this.state.feat)} type="button" className="butt stack_right" style={{ backgroundColor: "red" }}><b title="Remove">★</b></button>;
        }
        else if (this.state.status == 2) {
            myButt = <button onClick={() => this.state.butt_func(this.state.feat)} type="button" className="butt stack_right" style={{ backgroundColor: "green" }}><b title="Add">➕</b></button>;
        }
        return <div className="blackbox">
		{myButt}
		<b>{this.state.feat.name}</b>
		<hr></hr>
		<p>{this.state.feat.description}</p>
	</div>;
    }
}
export default FeatDisplay;
