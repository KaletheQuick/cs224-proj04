

// This is a simplified implementation of something I made awhile ago
// Creature = core_components is a list of 

// focus on levels 
// 	index 0 - Bonus feats
// 		  1+  Feats acquired at that level 

// feat = 

class C_Creature {
	public charname: string;
	public core_components = {};
	public levels = [];
	public secondary_components = {};
	//public current_active_effects : c_effect[] = [];


    constructor(name = "Fumbles") {
        this.charname = name;
		// port of data from fumbles!
		this.core_components = {};
		this.levels = [];
		this.secondary_components = {};

    }
}

class C_Feat {
	public name: string;
	public description: string; 
	
	constructor(_name : string, _description : string) {
		this.name = _name;
		this.description = _description;
	}
}