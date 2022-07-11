const Convertor = require('./Convertor');
const CommonUtility = require('./CommonUtility');
const DebugUtility = require('./DebugUtility');

function ConstructFilterObj(conditionObj){
    var filterObjList = {};
    if(conditionObj != null){
        //Expected Format: UID: >= 0
        for(const[key, value] of Object.entries(conditionObj)){     
            var meta = value.split(" ");
            if(meta[1].length > 1){
                var filterValueArray = Convertor.StringToArray(meta[1]);
                filterObjList[key.toString()] = {Operator: meta[0], Value: filterValueArray};
            }
            else{
                filterObjList[key.toString()] = {Operator: meta[0], Value: meta[1]};
            }
        }
    }
    return filterObjList;
}

function Filter(filterObj, targetMap, vaildCB, extraRule = null){
    var valid = false;
    for(const[m_key, m_value] of Object.entries(targetMap)){
        if(extraRule != null && typeof extraRule === "function"){
            valid = extraRule(m_key, m_value);
            if(valid == false) continue;
        }

        if(filterObj != null & valid){
            for(const[f_key, f_value]of Object.entries(filterObj)){
                if(m_value[f_key]){
                    if(Array.isArray(f_value.Value)){
                        for(var i = 0; i < f_value.Value.length; i++){
                            valid = CommonUtility.ConditionChecker(f_value.Operator, m_value[f_key], Number(f_value.Value[i]));
                            if(valid)
                                break;
                        }
                    }
                    else{
                        valid = CommonUtility.ConditionChecker(f_value.Operator, m_value[f_key], Number(f_value.Value));
                    }
                }
                else{
                    valid = false;
                }
            }
        }

        if(vaildCB != null && typeof vaildCB === "function"){
            if(valid) vaildCB(m_key, m_value);
        }
    }
}

module.exports.Filter = Filter;
module.exports.ConstructFilterObj = ConstructFilterObj;