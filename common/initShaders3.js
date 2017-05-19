
    // Get a file as a string using  AJAX
    function loadFileAJAX(name, onSucces, onError) {
        var xhr = new XMLHttpRequest(),
            okStatus = document.location.protocol === "file:" ? 0 : 200;
        xhr.open('GET', name, true);
        xhr.onreadystatechange= function () {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                return;
            }
            if (xhr.status !== 200) {
                onError(xhr.responseText);
                return;
            }
            onSucces(xhr.responseText);
        };
        xhr.send(null);
    }

    // Get files as a string array using AJAX
    function loadFilesAJAX(nameArray, onSucces, onError) {
        var resultArray = [];
        var successCount = 0;
        var hasError = false;
        for (var i = 0;i<nameArray.length;i++){
            // create new scope
            (function (index) {
                var xhr = new XMLHttpRequest(),
                    okStatus = document.location.protocol === "file:" ? 0 : 200;
                xhr.open('GET', nameArray[index], true);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState !== XMLHttpRequest.DONE) {
                        return;
                    }
                    successCount++;
                    resultArray[index] = xhr.responseText;
                    if (xhr.status !== 200) {
                        hasError = true;
                        onError(xhr.responseText);
                        return;
                    }
                    if (successCount == nameArray.length && hasError == false) {
                        onSucces(resultArray);
                    }
                };
                xhr.send(null);
            })(i);
        }
    }
    
    function initShaders(gl, vShaderName, fShaderName, onSuccess, onError) {
        function getShader(gl, shaderName, type, onSuccess, onError) {
                loadFileAJAX(shaderName, function (shaderScript) {
                    var shader = gl.createShader(type);
                    gl.shaderSource(shader, shaderScript);
                    gl.compileShader(shader);

                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                        onError(gl.getShaderInfoLog(shader));
                        return;
                    }
                    onSuccess(shader);
                }, onError);
        }
        var vertexShader,
            fragmentShader,
            program = gl.createProgram(),
            compileShaders = function () {
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);

                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    onError("Could not initialise shaders: "+gl.getProgramInfoLog (program));
                    return;
                }
                onSuccess(program);
            };

        getShader(gl, vShaderName, gl.VERTEX_SHADER, function(s){
            vertexShader = s;
            if (fragmentShader){
                compileShaders();
            }
        }, onError);
        getShader(gl, fShaderName, gl.FRAGMENT_SHADER, function(s){
            fragmentShader = s;
            if (vertexShader){
                compileShaders();
            }
        }, onError);

    }

