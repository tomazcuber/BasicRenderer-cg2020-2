(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.BasicRenderer = {}));
}(this, (function (exports) { 'use strict';


        /* ------------------------------------------------------------ */


        
    function inside(  x, y, primitive  ) {
            // You should implement your inside test here for all shapes   
            // for now, it only returns a false test
            
            return false
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
                for(var vertice of primitive.vertices){
                    if(vertice[0] < bbmin[0]) bbmin[0] = vertice[0];
                    if(vertice[1] < bbmin[1]) bbmin[1] = vertice[1];
                    if(vertice[0] > bbmax[0]) bbmax[0] = vertice[0];
                    if(vertice[1] > bbmax[1]) bbmax[1] = vertice[1];
                }

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

            preprocess: function(scene) {
                // Possible preprocessing with scene primitives, for now we don't change anything
                // You may define bounding boxes, convert shapes, etc
                
                var preprop_scene = [];

                for( var primitive of scene ) {  
                    // do some processing
                    if(primitive.hasOwnProperty("xform")){
                       primitive.vertices.forEach(this.applyXForm, primitive.xform);
                       console.log("Vertices are now: ", primitive.vertices);
                    }
                    
                    let boundingbox = this.boundingbox(primitive)
                    console.log("Generated Bounding Box:\n\tBB_min: " + boundingbox[0] + "\n\tBB_max: " + boundingbox[1] + "\n");
                    primitive.boundingbox = boundingbox;
                    

                    preprop_scene.push( primitive );
                    
                }

                
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

