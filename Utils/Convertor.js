//return array
function StringToArray(str, delimiter = ","){
    var arr = str.split(delimiter);
    for(var i = 0; i < arr.length; i++){
        arr[i] = arr[i].trim();
    }
    return arr;
}

module.exports.StringToArray = StringToArray;