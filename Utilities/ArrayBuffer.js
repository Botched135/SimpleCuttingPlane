/**
 * Created by rasmusbons on 06-05-2017.
 */
function CreateArrayBuffer(array)
{
    // convert to native array
    var floatArray = new Float32Array(array);
    // create buffer id
    var id = gl.createBuffer();
    // set id to the current active array buffer (only one can be active)
    gl.bindBuffer(gl.ARRAY_BUFFER, id);
    // upload buffer data
    var hints = gl.STATIC_DRAW;
    gl.bufferData(gl.ARRAY_BUFFER, floatArray, hints);
    return id;
}

function CreateElementArrayBuffer(array)
{
    // convert to native array
    var intArray = new Uint16Array(array);
    // create buffer id
    var id = gl.createBuffer();
    // set id to the current active array buffer (only one can be active)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
    // upload buffer data
    var hints = gl.STATIC_DRAW;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, intArray, hints);
    return id;
}