var project = {
    init: function () {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.scene = new THREE.Scene();
        var light = new THREE.DirectionalLight(0xdfdf00, 1.5);
        light.position.set(1, 1, 1);
        this.scene.add(light);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0xffffff);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    },
    animate: function () {

    },

    //return array with height data from img
    getHeightData: function (img, scale) {
        if (scale == undefined) scale = 1;

        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext('2d');

        var size = img.width * img.height;
        var data = new Float32Array(size);

        context.drawImage(img, 0, 0);

        for (var i = 0; i < size; i++) {
            data[i] = 0
        }

        var imgd = context.getImageData(0, 0, img.width, img.height);
        var pix = imgd.data;

        var j = 0;
        for (var i = 0; i < pix.length; i += 4) {
            var all = pix[i] + pix[i + 1] + pix[i + 2];
            data[j++] = all / (12 * scale);
        }

        return data;
    }
};
