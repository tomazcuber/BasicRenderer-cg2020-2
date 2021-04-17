(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.BasicRenderer = {}));
}(this, (function (exports) { 'use strict';


        /* ------------------------------------------------------------ */


        
    function inside(  x, y, primitive  ) {
            // You should implement your inside test here for all shapes   

            let isInside = false;
            for(let i = 0; i < primitive.vertices.length; i++) {
                let v1 = primitive.vertices[i % primitive.vertices.length]
                let v2 = primitive.vertices[(i+1) % primitive.vertices.length]
                let edge = [v2[0] - v1[0], v2[1] - v1[1]];
                let normal =  [edge[1], -edge[0]];
                let distanceVector = [x - v1[0], y - v1[1]];
                let dotProduct = normal[0] * distanceVector[0] + normal[1] * distanceVector[1];
                if(dotProduct > 0){
                     isInside = false;
                     break;
                     console.log("point: (",x,", ",y,"is not inside" );
                }
                else isInside = true;
            }

            return isInside;
            
    }
        
    
    function Screen( width, height, scene ) {
        this.width = width;
        this.height = height;
        this.scene = this.preprocess(scene);   
        this.createImage(); 
    }

    Object.assign( Screen.prototype, {

            boundingbox: function(primitive) {
                let bbmin = [Infinity, Infinity];
                let bbmax = [-Infinity, -Infinity];
                // if(primitive.shape != "circle"){
                    for(var vertice of primitive.vertices){
                        if(vertice[0] < bbmin[0]) bbmin[0] = vertice[0];
                        if(vertice[1] < bbmin[1]) bbmin[1] = vertice[1];
                        if(vertice[0] > bbmax[0]) bbmax[0] = vertice[0];
                        if(vertice[1] > bbmax[1]) bbmax[1] = vertice[1];
                    }
                // } else {
                    // bbmin = primitive.center.map((value) => {return value - primitive.radius});
                    // bbmax = primitive.center.map((value) => {return value + primitive.radius});
                // }
                bbmin[0] = Math.floor(Math.min(bbmin[0], vertice[0]));
                bbmin[1] = Math.floor(Math.min(bbmin[1], vertice[1]));
                bbmax[0] = Math.ceil(Math.max(bbmax[0], vertice[0]));
                bbmax[1] = Math.ceil(Math.max(bbmax[1], vertice[1]));
                return [bbmin, bbmax];
            },

            applyXForm: function(vertice, index, vertices){
                console.log("Applying xform: ", this, "to vertice: " + vertice);
                let vertice3 = [vertice[0], vertice[1], 1];
                let transformedVertice = [0,0,0];
                for(var i = 0; i < this.length; i++){
                    let row = this[i];
                    for(var j = 0; j < row.length; j++){
                        transformedVertice[i] += row[j] * vertice3[j];
                    }
                }
                console.log("Vertice: ", vertice, "transformed to: ", transformedVertice);
                vertices[index] = [transformedVertice[0], transformedVertice[1]];
            },

            circleTriangulation: function(circle, nVertices){
                let generatedVertices = [];
                let angle = (2 * Math.PI) / nVertices;
                for(let i = 0; i < nVertices; i++){
                    let x = circle.radius * Math.cos(i * angle) + circle.center[0];
                    let y = circle.radius * Math.sin(i * angle) + circle.center[1];
                    generatedVertices.push([x,y]);
                    
                }

                let generatedTriangles = [];
                const Triangle = class {
                    constructor(vertices){
                        this.shape = "triangle";
                        this.vertices = vertices;
                        this.color = circle.color;
                        if(circle.hasOwnProperty("xform")){
                            this.xform = circle.xform;
                        }
                    }
                    
                };
                for(let i = 0; i < generatedVertices.length; i++){
                    console.log("Triangle ", i, " = [(", circle.center, ", ", generatedVertices[(i % nVertices)], ", ", generatedVertices[((i + 1) % nVertices)], ")" )
                    let triangle = new Triangle([circle.center, generatedVertices[(i % nVertices)], generatedVertices[((i + 1) % nVertices)]]);
                    generatedTriangles.push(triangle)
                    console.log(triangle)
                }
                
                return generatedTriangles;
                
            },

            fanTriangulation(polygon){
                let generatedTriangles = [];
                const Triangle = class {
                    constructor(vertices){
                        this.shape = "triangle";
                        this.vertices = vertices;
                        this.color = polygon.color;
                        if(polygon.hasOwnProperty("xform")){
                            this.xform = polygon.xform;
                        }
                    }
                    
                };
                let nVertices = polygon.vertices.length;
                for(let i = 1; i < nVertices - 1; i++){
                    let triangle = new Triangle([polygon.vertices[0], polygon.vertices[i % nVertices], polygon.vertices[(i+1) % nVertices]]);
                    generatedTriangles.push(triangle);
                    //console.log(triangle);
                }
                //console.log(generatedTriangles)
                return generatedTriangles;
            },

            preprocess: function(scene) {
                // Possible preprocessing with scene primitives, for now we don't change anything
                // You may define bounding boxes, convert shapes, etc
                
                var preprop_scene = [];

                for( var primitive of scene ) { 
                    //console.log(primitive) 
                    
                    if(primitive.shape == "circle"){
                        let circleTriangles = this.circleTriangulation(primitive, 30);
                        for(var triangle of circleTriangles){
                          scene.push(triangle);
                        }
                        continue;  
                    }

                    if(primitive.shape == "polygon"){
                        let polygonTriangles = this.fanTriangulation(primitive);
                        for(var triangle of polygonTriangles){
                            scene.push(triangle);
                        }
                        //scene.pop();
                        continue;
                    }
                    
                    
                    if(primitive.hasOwnProperty("xform")){
                       primitive.vertices.forEach(this.applyXForm, primitive.xform);
                    }

                    
                    
                    let boundingbox = this.boundingbox(primitive)
                    primitive.boundingbox = boundingbox;
                    console.log(primitive.boundingbox)
                    
                    
                    preprop_scene.push( primitive );
                    
                }
                console.log(preprop_scene)
                
                return preprop_scene;
            },

            createImage: function() {
                this.image = nj.ones([this.height, this.width, 3]).multiply(255);
            },

            rasterize: function() {
                var color;
         
                // In this loop, the image attribute must be updated after the rasterization procedure.
                for( var primitive of this.scene ) {

                    // Loop through all pixels
                    // Use bounding boxes in order to speed up this loop
                    let boundingBoxMin = primitive.boundingbox[0];
                    let boundingBoxMax = primitive.boundingbox[1];
                    for (var i = boundingBoxMin[0]; i < boundingBoxMax[0]; i++) {
                        var x = i + 0.5;
                        for( var j = boundingBoxMin[1]; j < boundingBoxMax[1]; j++) {
                            var y = j + 0.5;

                            // First, we check if the pixel center is inside the primitive 
                            if ( inside( x, y, primitive ) ) {
                                // only solid colors for now
                                color = nj.array(primitive.color);
                                this.set_pixel( i, this.height - (j + 1), color );
                            }
                            
                        }
                    }
                }
                
               
              
            },

            set_pixel: function( i, j, colorarr ) {
                // We assume that every shape has solid color
         
                this.image.set(j, i, 0,    colorarr.get(0));
                this.image.set(j, i, 1,    colorarr.get(1));
                this.image.set(j, i, 2,    colorarr.get(2));
            },

            update: function () {
                // Loading HTML element
                var $image = document.getElementById('raster_image');
                $image.width = this.width; $image.height = this.height;

                // Saving the image
                nj.images.save( this.image, $image );
            }
        }
    );

    exports.Screen = Screen;
    
})));

