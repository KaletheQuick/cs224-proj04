"use strict";
class c_effect {
    constructor(_target, _type, _source, _stackability, _amount) {
        this.target = _target;
        this.type = _type;
        this.source = _source;
        this.stackability = _stackability;
        this.amount = _amount;
    }
}
class c_creature {
    constructor(name = "Fumbles") {
        this.core_components = {};
        this.levels = [];
        this.secondary_components = {};
        this.current_active_effects = (Array);
        this.charname = name;
        // port of data from fumbles!
        this.core_components = {};
        this.levels = [];
        this.secondary_components = {};
        // TODO Slots granted
        // TODO Items equipped
        // TODO Inventory
        // TODO temporary effects
        // Non save data, should be reevaluated all the time
        this.current_active_effects = (Array);
    }
    load(charOb) {
        this.charname = charOb.charname;
        this.core_components = charOb.core_components;
        this.levels = charOb.levels;
        this.secondary_components = charOb.secondary_components;
        this.consolidateEffects();
    }
    consolidatedBonus(target_stat) {
        let nBo = 0;
        let bonusesForThisOneStatWeAreCheckingOut = [];
        let ourTopBonuses = {};
        // Assist [target,type,stackability,amount]
        let target = 0;
        let type = 1;
        let stackability = 2;
        let amount = 3;
        let source = 4; // TODO add source tracking to slot 5 in effect consolidation
        for (let index = 0; index < this.current_active_effects.length; index++) {
            if (this.current_active_effects[index].target == target_stat) {
                if (this.current_active_effects[index][type] in ourTopBonuses) {
                    // TODO How do I want to handle stacking?
                    // Current:
                    // 0 - stack indefnitely
                    // 1 - stack once
                    // n - stack n times
                    // negative numbers saved for special cases?
                    // Check stackability // to start, just stack everything with 0
                    if (this.current_active_effects[index][stackability] == 0) {
                        if (ourTopBonuses[this.current_active_effects[index][type]].source[ourTopBonuses[this.current_active_effects[index][type]].source.length - 1] != ")") {
                            // if not already () on end
                            ourTopBonuses[this.current_active_effects[index][type]].source += "(" + ourTopBonuses[this.current_active_effects[index][type]].amount + ")";
                        }
                        ourTopBonuses[this.current_active_effects[index][type]].amount += this.current_active_effects[index][amount];
                        ourTopBonuses[this.current_active_effects[index][type]].source += ", " + this.current_active_effects[index][source] + "(" + this.current_active_effects[index][amount] + ")";
                    }
                    else if (ourTopBonuses[this.current_active_effects[index][type]][amount] < this.current_active_effects[index][amount]) {
                        // replace
                        ourTopBonuses[this.current_active_effects[index][type]] = this.current_active_effects[index];
                    }
                }
                else {
                    // add
                    let new_effect = {
                        "target": this.current_active_effects[index][target],
                        "type": this.current_active_effects[index][type],
                        "source": this.current_active_effects[index][source],
                        "stackability": this.current_active_effects[index][stackability],
                        "amount": this.current_active_effects[index][amount]
                    };
                    ourTopBonuses[this.current_active_effects[index][type]] = new_effect;
                }
            }
        }
        if (target == 49) {
            console.log("topper");
            console.log(ourTopBonuses);
        }
        // sum bonus for real now
        for (var key in ourTopBonuses) {
            nBo += ourTopBonuses[key].amount;
        }
        let consilidatedBonusObjectro = {
            "total": nBo,
            "bonuses": ourTopBonuses
        };
        return consilidatedBonusObjectro;
    }
    consolidateEffects() {
        let theEffects = [];
        // Cycle through things in the guy
        // Core Components
        for (let index = 0; index < this.core_components.length; index++) {
            const element = this.core_components[index];
            theEffects = theEffects.concat(this.shuck_list(element.attributes));
        }
        // Levels
        for (let index = 0; index < this.levels.length; index++) {
            const element = this.levels[index];
            theEffects = theEffects.concat(this.shuck_list(element));
        }
        // Secondary components (wrong order?)
        for (let index = 0; index < this.secondary_components.length; index++) {
            const element = this.secondary_components[index];
            theEffects = theEffects.concat(this.shuck_list(element.attributes));
        }
        // Equipment
        this.current_active_effects = theEffects;
    }
    shuck_list(listyBoi) {
        let returnable = [];
        for (let index = 0; index < listyBoi.length; index++) {
            const element = listyBoi[index];
            console.log(listyBoi.name);
            let feat = this.shuck_feat(element);
            returnable = returnable.concat(feat);
        }
        return returnable;
    }
    shuck_feat(feat) {
        let returnable = [];
        for (let index = 0; index < feat.effects.length; index++) {
            const element = [...feat.effects[index]];
            element.push(feat.name);
            returnable.push(element);
        }
        return returnable;
    }
}
