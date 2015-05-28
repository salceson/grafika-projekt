var project = {
    init: function () {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0xffffff);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.lookAt(project.scene.position);
        this.camera.position.set(10, 10, 10);
        this.scene.add(this.camera);

        //var light = new THREE.DirectionalLight(0xdfdf00, 1.5);
        //light.position.set(1, 1, 1);

        var geometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        for (var i = 0, l = geometry.vertices.length; i < l; i++) {

            var vertex = geometry.vertices[i];
            vertex.x += Math.random() * 20 - 10;
            vertex.y += Math.random() * 2;
            vertex.z += Math.random() * 20 - 10;

        }

        for (var i = 0, l = geometry.faces.length; i < l; i++) {

            var face = geometry.faces[i];
            face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

        }
        var material = new THREE.MeshBasicMaterial({
            vertexColors: THREE.VertexColors,
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        //this.scene.add(light);
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize, false);
    },
    onWindowResize: function () {
        project.camera.aspect = window.innerWidth / window.innerHeight;
        project.camera.updateProjectionMatrix();
        project.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    animate: function () {
        requestAnimationFrame(project.animate);
        project.renderer.render(project.scene, project.camera);
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
