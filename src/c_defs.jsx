"use strict";
// This is a simplified implementation of something I made awhile ago
// Creature = core_components is a list of 
// focus on levels 
// 	index 0 - Bonus feats
// 		  1+  Feats acquired at that level 
// feat = 
class C_Creature {
    //public current_active_effects : c_effect[] = [];
    constructor(name = "Fumbles") {
        this.core_components = {};
        this.levels = [];
        this.secondary_components = {};
        this.charname = name;
        // port of data from fumbles!
        this.core_components = {};
        this.levels = [];
        this.secondary_components = {};
    }
}
class C_Feat {
    constructor(_name, _description) {
        this.name = _name;
        this.description = _description;
    }
}
