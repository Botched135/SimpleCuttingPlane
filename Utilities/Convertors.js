/**
 * Created by rasmusbons on 06-05-2017.
 */
function hexToRgb(hex) {
    if (Array.isArray(hex)){
        return [hex[0]/255,hex[1]/255,hex[2]/255,1];
    }

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? ( [
        parseInt(result[1], 16)/255,
        parseInt(result[2], 16)/255,
        parseInt(result[3], 16)/255,
        1
    ]) : null;
}