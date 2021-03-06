﻿// Create Sketch Object
var sketch = new Processing.Sketch();

sketch.attachFunction = function (processing, vMath) {
    // Variable global para el pedestrian
    var ped;
    var theCrowd;
    var WIDTH = 400;
    var HEIHT = 400;
    var crowdEnable = false;

    // Vector Math Library
    var vMath = {
        
        // Methods
        calcNormalizationAngle: function(vecIn){
            // Unitary vector toward "y" axis
            var jVector = new processing.PVector(0.0,1.0);
            var angle = processing.PVector.angleBetween(jVector,vecIn);
            if(vecIn.x < 0)
            {
                angle *= -1;
            }
            return angle;
        },

        rotate2DVector : function(vec, rad){
            var output = new processing.PVector(0.0,0.0);
            output.x =
                vec.x * processing.cos(rad) - vec.y * processing.sin(rad);
            output.y =
                vec.y * processing.cos(rad) + vec.x * processing.sin(rad);
            return output;
        },

        ClosenessPercentage : function(disp1, disp2){
            // disp1: Desplazamiento del personaje 
            // Se define como el procentaje de la longitud 
            // de la proyección de disp1 sobre
            // La longitud del vector de desplazamiento "disp2"
            var proj = processing.PVector.dot(disp1, disp2) / disp2.mag();

            // Verificando que el porcentaje no sea menor que cero
            if(proj < 0)
            {
                // TODO: Proyección negativa
                //throw "Error2: Proyección negativa";
                console.log("Proyección negativa");
            }
            var percetange = proj / disp2.mag();
            return percetange;
        }
    };

    // --------------------------------------
    // ================= #SETUP ==============
    // --------------------------------------
    processing.setup = function () {
        //processing.noLoop();
        // Creating crowd
        theCrowd = new crowd();
        // Estableciendo el tamaño del Terreno
        processing.size(WIDTH, HEIHT);
        
        var crowdPopulation = Number(prompt("Enter the crowd Population"));
        
        if(true)
        {
            crowdEnable = true;
            // Creating crowd
            //theCrowd = new crowd();

            // init crowd
            var inicioManual = confirm("Iniciar manualmente");
            if(inicioManual){
                // Inicio manual
                var population; 
                switch(1){
                    case 0:
                        population = [[10,10,300,300]];
                        break;
                    case 1: // Circle test
                        population = 
                        [[ 193.241240923023, 49.2603439123139, 175.150267496598, 364.027535211563],
                        [ 284.021463158803, 84.6347397353912, 84.3700452608174, 328.653139388485],
                        [ 336.671657527123, 166.612502952032, 31.7198508924980, 246.675376171845],
                        [ 331.081239293572, 263.880914335170, 37.3102691260491, 149.406964788707],
                        [ 99.0059502075814, 74.0011323557231, 269.385558212040, 339.286746768154],
                        [ 175.150267496598, 364.027535211563, 193.241240923023, 49.2603439123139],
                        [ 84.3700452608174, 328.653139388485, 284.021463158803, 84.6347397353912],
                        [ 31.7198508924980, 246.675376171845, 336.671657527123, 166.612502952032],
                        [ 37.3102691260491, 149.406964788707, 331.081239293572, 263.880914335170],
                        [ 269.385558212040, 339.286746768154, 99.0059502075814, 74.0011323557231]];
                        break;
                    default:
                        population = [[5,5,200,200]];
                        break;
                }
                // #POPULATE
                theCrowd.populate(population);
            }
            else{
                // Inicio aleatoreo
                theCrowd.populateRandomly(crowdPopulation);
            }
            // Render background Erase previous
            processing.background(1, 54, 120);
        }
        else
        {
            // Inicializando y creando al pedestrian
            ped = new Pedestrian(new processing.PVector(250, 250));
            ped.goalCoord = new processing.PVector(125, 125); 
        }            
    };

    // --------------------------------------
    // ================= DRAW ===============
    // --------------------------------------
    // Override draw function, by default it will be called
    // 60 times per second
    processing.draw = function () {
        // Erase background
        processing.background(1, 54, 120);

        if(crowdEnable)
        {
            // Update Function
            theCrowd.update();
            // Render pedestrian
            theCrowd.render();
        }
        else
        {
            // Update Function
            ped.update();
            // Render pedestrian
            ped.render();
        }
    };

    // --------------------------------------
    // ================= Pedestrian ============
    // --------------------------------------
    var Pedestrian = function (location) {
                   
        // Variables
        this.alpha = 0.0; // Pedestrian angle
        // Social Forces
        this.neighborsForce = new processing.PVector(0.0,0.0);
        // Behavior Variables
        this.loopGoal = true;
        this.slowness = Math.random() * (3.5 - 1.5) + 1.5;
        // Color of pedestrian
        this.rColor = Math.floor(Math.random() * (255 - 0)) + 0;          
        this.gColor = Math.floor(Math.random() * (255 - 0)) + 0;
        this.bColor = Math.floor(Math.random() * (255 - 0)) + 0;

        if(location === undefined)
        {
            location =
                new processing.PVector(1,1);
        } 
        // Movement variables
        this.state = "stop"; //stop, walking, goal
        this.startPosition = new processing.PVector(location.x,location.y);
        this.lastPosition = new processing.PVector(location.x,location.y);
        this.location = new processing.PVector(location.x,location.y);
        this.goalCoord = new processing.PVector(0, 0);        
        this.velocity = new processing.PVector(0, 0);
        // Extras
        this.aceleration = new processing.PVector(0, 0);
        this.r = 4.0;
        this.maxForce = 0.03; // Maximun steering force
        this.maxSpeed = 2.0; //  Maximun speed 

        // Generate Goals
        this.setNewGoal = function(xg, yg){
            this.goalCoord = 
                  new processing.PVector(xg, yg);
            // Asignando el estado de caminando
            this.state = "walking";
        };
        // -
        this.generateNewRandomGoal = function(){            
            var xg;// = Math.floor(Math.random() * (WIDTH - 0)) + 0;
            var yg;// = Math.floor(Math.random() * (HEIHT - 0)) + 0;
            do
            {
                xg = Math.floor(Math.random() * (WIDTH - 10)) + 0;
                yg = Math.floor(Math.random() * (HEIHT - 10)) + 0;
            }while(
                    Math.sqrt(
                        Math.pow(xg - this.location.x,2) + 
                        Math.pow(yg - this.location.y,2)
                        ) < 10);
            this.setNewGoal(xg, yg);
            /*this.goalCoord = 
            new processing.PVector(xg, yg);*/
        };

        // Genera posicion aleatoria
        this.generateNewRandomLocation = function(){
            var xg = Math.floor(Math.random() * (WIDTH - 0)) + 0;
            var yg = Math.floor(Math.random() * (HEIHT - 0)) + 0;
            this.location = 
                new processing.PVector(xg, yg);            
        };

        // Hello function
        this.saluda = function () {
            alert("Soy el pedestrian.");
        };

        this.initializePedestrian = function () {            
        };

        // ----> #update pedestrian Function
        this.update = function()
        {
            kob.getDataDrivenBehavior(this);
        };

        this.render = function () {
            // Render Pedestrian                      
            processing.fill(this.rColor, this.gColor, this.bColor);
            processing.stroke(255);
            processing.pushMatrix();
            processing.translate(this.location.x,
                                this.location.y);
            processing.rotate(this.alpha);
            processing.beginShape(processing.TRIANGLES);
            processing.vertex(0, -this.r * 2);
            processing.vertex(-this.r, this.r * 2);
            processing.vertex(this.r, this.r * 2);
            processing.endShape();
            processing.popMatrix();

            // Render Goal            
            processing.fill(this.rColor, this.gColor, 0);
            processing.stroke(255);
            processing.ellipse(this.goalCoord.x,this.goalCoord.y,10,10);
        };

        this.setLocation = function(x, y){
            var location = new processing.PVector(x, y);            
            this.startPosition = new processing.PVector(location.x,location.y);
            this.lastPosition = new processing.PVector(location.x,location.y);
            this.location = new processing.PVector(location.x,location.y);
            this.velocity = new processing.PVector(0, 0);
        }

        // Get the last displacement
        this.getLastDisplacement = function () {
            return new processing.PVector.sub(this.lastPosition, this.startPosition);
        };

        // Get current displacement
        this.getCurrentDisplacement = function () {
            return new processing.PVector.sub(this.location, this.startPosition);
        };

        // Get Velocity
        this.getVelocity = function () {
            var cd = this.getCurrentDisplacement();
            var ld = this.getLastDisplacement();
            // TODO: WARNING: ESTA DEMAS UNA INSTRUCCION
            var _velocity = processing.PVector.sub(cd,ld);
            this.velocity = new processing.PVector(_velocity.x,_velocity.y);
            return _velocity;
            //return new processing.PVector.sub(this.getCurrentDisplacement(),
            //this.getLastDisplacement());
        };

        // Get Goal Vector
        this.getGoalVector = function () {
            return new processing.PVector.sub(this.goalCoord,
            this.startPosition);
        };

        // Perform Action
        this.performAction = function(actionVector){
            this.lastPosition = new processing.PVector(
                this.location.x,
                this.location.y);
            if( this.state === "goal") //stop, walking, goal)
            {
                // Se para el peaton
                this.state = "stop";
                
                // Ajustando posicion de meta
                this.setLocation(
                    this.goalCoord.x,
                    this.goalCoord.y);

                if(this.loopGoal)
                {
                    // Asignando una nueva meta
                    this.generateNewRandomGoal();                 
                }
            }
            else if(this.state != "stop")
            {
                //this.state = "walking";
                this.location.x = this.location.x + actionVector.x/this.slowness;
                this.location.y = this.location.y + actionVector.y/this.slowness;                
            }
        }
    };
    
    // --------------------------------------
    // --------------------------------------
    // ================= Crowd ============
    // --------------------------------------
    // --------------------------------------
    var crowd = function(){
        // Create the population
        this.crowdArray = [];
        this.population = 0;

        // Crowd Pupulation function
        this.push = function(pedestrian)
        {
            this.crowdArray.push(pedestrian);
            this.population++;
        };
        // #POPULATE
        this.populate = function(pedBatch){
            this.population = pedBatch.length;
            for(var i = 0; i < this.population; i++)
            {                
                // La funcion que agrega
                // una multitud por lote [loc,goal]
                // Creando al peaton
                var ped = new Pedestrian();
                // Asignando posición
                var _xg = pedBatch[i][0];
                var _yg = pedBatch[i][1];
                console.log('--> Ped['+ i +'] location: x: ' + _xg + ", y: " + _yg);
                ped.setLocation(_xg, _yg);
                // Asignando nueva menta
                _xg = pedBatch[i][2];
                _yg = pedBatch[i][3];
                console.log('--> Ped['+ i +'] Goal: x: ' + _xg + ", y: " + _yg);
                console.log("------")
                ped.setNewGoal(_xg, _yg);
                // No generar nueva meta
                ped.loopGoal = false;
                // Incorporar peaton a la multidud
                this.crowdArray.push(ped);
            }
        };
        // 
        this.populateRandomly = function(crowdSize){
            this.population = crowdSize;
            // Initialize Crowd
            for(var i = 0; i < this.population; i++)
            {
                var ped = new Pedestrian();
                ped.generateNewRandomGoal();
                ped.generateNewRandomLocation();
                this.crowdArray.push(ped);
            };
        };

        // Methods
        // #update Crowd
        this.update = function(){
            kob.getDataHelbingCrowdBehavior(this);            
        };

        this.render = function(){
            for(var i = 0; i < this.population; i++)
            {
                this.crowdArray[i].render();
            }
        };
    };    

    var kob = {
        // Find the nearest behavior Method
        getDataDrivenBehavior: function (pdestrian) {
            // Generate vof
            var goal;
            // Hardcodeado implementar rutina en C# que incruste el valor 
            // maximo de meta
            var maxGoalValue = 102.41;
            //console.log("gv: " + pdestrian.getGoalVector().mag());
            var gv = pdestrian.getGoalVector().mag();
            if(pdestrian.getGoalVector().mag() > maxGoalValue)
            {
                // Se reasigna posición inicial                
                pdestrian.startPosition = 
                    new processing.PVector(
                        pdestrian.location.x, pdestrian.location.y);
                pdestrian.lastPosition = 
                    new processing.PVector(
                        pdestrian.location.x, pdestrian.location.y);
                goal = pdestrian.getGoalVector();                
            }
            else
            {
                goal = pdestrian.getGoalVector();
            }            

            // Calculating Normalization Angle
            var angle = vMath.calcNormalizationAngle(goal);            
            
            // Normalizing Goal
            var normGoal = vMath.rotate2DVector(goal, angle);

            // Make the vector of feature to calculate action
            var velocity = pdestrian.getVelocity();
            // Normilize speed vector
            velocity = vMath.rotate2DVector(velocity, angle);

            // Calculating displacement
            var displacement = pdestrian.getCurrentDisplacement();
            // Normilizing displacement
            displacement = vMath.rotate2DVector(displacement, angle);

            // Calculating clossenes percetange
            var closenessComponent = 
                vMath.ClosenessPercentage(displacement, normGoal);
            /*if(closenessComponent < 0)
                pdestrian.state = "stop";*/

            // The Character got the goal
            if(closenessComponent >= 0.95)
            {
                pdestrian.state = "goal";
            }

            // Construcción del vector de caracteristicas
            var v1 = [normGoal.y, velocity.x, velocity.y, closenessComponent];

            // Calculando comportamiento
            var optimalDistance = Number.MAX_VALUE;
            var indexOfOptimalDistance = 0;

            // Move vector
            var moveVector = new processing.PVector(0,0);
            
            // Seraching the index of the optimal distance
            for (var i = 0; i < this.matrixOfBehaviors.length; i++) {
                var eDist = // euclidean dist
                    Math.sqrt(
                    Math.pow(v1[0] - this.matrixOfBehaviors[i][0], 2) +
                    Math.pow(v1[1] - this.matrixOfBehaviors[i][1], 2) +
                    Math.pow(v1[2] - this.matrixOfBehaviors[i][2], 2) +
                    Math.pow(v1[3] - this.matrixOfBehaviors[i][3], 2));
                if (eDist < optimalDistance) {
                    optimalDistance = eDist;
                    indexOfOptimalDistance = i;
                }
            }
            
            moveVector = new processing.PVector
                (this.matrixOfBehaviors[indexOfOptimalDistance][4],
                this.matrixOfBehaviors[indexOfOptimalDistance][5]);
            
            // Rotate vector (Unormilize)
            moveVector = vMath.rotate2DVector(moveVector, -angle);

            // Adding social neighbors forces
            moveVector.add(pdestrian.neighborsForce);

            // Set the pedestrian angle
            pdestrian.alpha = moveVector.heading2D() + processing.radians(90);

            // Limit moveVector
            moveVector.limit(5);            
            
            // Move pedestrian acording to calculated vector
            pdestrian.performAction(moveVector);
        },
        getDataHelbingCrowdBehavior : function(crowd){
            // Parameter            
            var a_i = 2000.0; // Interaction force parameter
            var b_i = 0.8; // Interaction force parameter
            var k_big = 120000.0; // Bodyforce parameter
            var k_small = 240000.0; // Sliding force parameter

            // Sum of the radious of pedestrian
            // space
            var r_ij = 0; //r_i = 4 + r_j = 4

            for(var i = 0; i < crowd.population; i++)
            {                
                // Initialing neighborsForce of i_th pedestrian
                crowd.crowdArray[i].neighborsForce = 
                    new processing.PVector(0.0,0.0);
                // Avoidance Calculations
                // j: Other pedestrian index
                for(var j = 0; j < crowd.population; j++)
                {
                    r_ij = 12;//this.crowdArray[i].r + this.crowdArray[j].r;
                    if(i != j)
                    {
                        // Distance between pedestrinas
                        var d_ij = 
                            processing.PVector.dist(
                                crowd.crowdArray[i].location,
                                crowd.crowdArray[j].location);
                        // CheckGroups

                        // Avoid far away pedestrias
                        if(d_ij <= 2 * r_ij) // org: d_ij <= 4 * r_ij
                        {
                            var gDelta_r_ij_d_ij = r_ij - d_ij;
                            if(d_ij > r_ij )
                                gDelta_r_ij_d_ij = 0;
                            // Normalization (unitary vector)
                            // of i to j pedestrians
                            var n_ij = 
                                processing.PVector.sub(
                                    crowd.crowdArray[i].location,
                                    crowd.crowdArray[j].location);
                            n_ij.normalize();

                            //console.log("n_ij: " + n_ij.x + "," + n_ij.y);
                            // Tangencial force
                            var t_ij =
                                new processing.PVector(-n_ij.y,n_ij.x);

                            // Sliding force
                            var slidingForce = 
                                processing.PVector.mult(t_ij,
                                    k_small * (gDelta_r_ij_d_ij) *
                                    processing.PVector.dot(processing.PVector.sub
                                        (crowd.crowdArray[j].velocity,
                                        crowd.crowdArray[i].velocity),t_ij)
                                );

                            // scalar magnitude
                            // Force of interaction
                            var interactionForce =
                                a_i * Math.exp((r_ij - d_ij) / b_i);                            

                            // scalar magnitude
                            // Body force = 
                            // K_big *(r_ij-d_ij)                            
                            var bodyForce = k_big * (gDelta_r_ij_d_ij);

                            // Fuerza de estrujamiento
                            var squeezeForce = 
                                processing.PVector.mult(
                                    n_ij, interactionForce + bodyForce);

                            // Current pedestrian neighborsForce
                            var PedNeighborsForce = 
                                processing.PVector.add(squeezeForce,slidingForce);

                            // neighborsForce = neighborsForce + PedNeighborsForce
                            crowd.crowdArray[i].neighborsForce.add(PedNeighborsForce);
                        }
                    }
                }
                // Update goals movement
                //crowd.crowdArray[i].update();
                this.getDataDrivenBehavior(crowd.crowdArray[i]);
            }
        },
        // ========= IMPORTANT FUNCTIONS ===========
        // ----> Knowledge Of Behavior
        // 0: Goal Lenght
        // 1: Vel x
        // 2: Vel y
        // 3: Clossenes
        // 4: Action x
        // 5: Action y
        matrixOfBehaviors:
            [[ 2.84, 0.00, 0.00, 0.00, 0.00, 2.84],
            [ 2.84, 0.00, 2.84, 1.00, 0.00, 0.00],
            [ 5.72, 0.00, 0.00, 0.00,-0.01, 2.84],
            [ 5.72,-0.01, 2.84, 0.50, 0.01, 2.88],
            [ 5.72, 0.01, 2.88, 1.00, 0.00, 0.00],
            [ 8.90, 0.00, 0.00, 0.00,-0.02, 2.84],
            [ 8.90,-0.02, 2.84, 0.32, 0.00, 2.88],
            [ 8.90, 0.00, 2.88, 0.64, 0.02, 3.18],
            [ 8.90, 0.02, 3.18, 1.00, 0.00, 0.00],
            [12.02, 0.00, 0.00, 0.00, 0.00, 2.84],
            [12.02, 0.00, 2.84, 0.24, 0.02, 2.88],
            [12.02, 0.02, 2.88, 0.48, 0.04, 3.18],
            [12.02, 0.04, 3.18, 0.74,-0.06, 3.12],
            [12.02,-0.06, 3.12, 1.00, 0.00, 0.00],
            [14.93, 0.00, 0.00, 0.00, 0.02, 2.84],
            [14.93, 0.02, 2.84, 0.19, 0.04, 2.88],
            [14.93, 0.04, 2.88, 0.38, 0.06, 3.18],
            [14.93, 0.06, 3.18, 0.60,-0.04, 3.12],
            [14.93,-0.04, 3.12, 0.80,-0.08, 2.91],
            [14.93,-0.08, 2.91, 1.00, 0.00, 0.00],
            [17.80, 0.00, 0.00, 0.00, 0.06, 2.84],
            [17.80, 0.06, 2.84, 0.16, 0.08, 2.88],
            [17.80, 0.08, 2.88, 0.32, 0.10, 3.18],
            [17.80, 0.10, 3.18, 0.50, 0.00, 3.12],
            [17.80, 0.00, 3.12, 0.68,-0.03, 2.91],
            [17.80,-0.03, 2.91, 0.84,-0.22, 2.87],
            [17.80,-0.22, 2.87, 1.00, 0.00, 0.00],
            [20.41, 0.00, 0.00, 0.00, 0.12, 2.84],
            [20.41, 0.12, 2.84, 0.14, 0.14, 2.87],
            [20.41, 0.14, 2.87, 0.28, 0.17, 3.18],
            [20.41, 0.17, 3.18, 0.44, 0.07, 3.12],
            [20.41, 0.07, 3.12, 0.59, 0.03, 2.91],
            [20.41, 0.03, 2.91, 0.73,-0.16, 2.87],
            [20.41,-0.16, 2.87, 0.87,-0.38, 2.62],
            [20.41,-0.38, 2.62, 1.00, 0.00, 0.00],
            [23.11, 0.00, 0.00, 0.00, 0.17, 2.84],
            [23.11, 0.17, 2.84, 0.12, 0.19, 2.87],
            [23.11, 0.19, 2.87, 0.25, 0.23, 3.17],
            [23.11, 0.23, 3.17, 0.38, 0.12, 3.11],
            [23.11, 0.12, 3.11, 0.52, 0.08, 2.91],
            [23.11, 0.08, 2.91, 0.65,-0.10, 2.87],
            [23.11,-0.10, 2.87, 0.77,-0.33, 2.63],
            [23.11,-0.33, 2.63, 0.88,-0.37, 2.69],
            [23.11,-0.37, 2.69, 1.00, 0.00, 0.00],
            [25.72, 0.00, 0.00, 0.00, 0.22, 2.83],
            [25.72, 0.22, 2.83, 0.11, 0.24, 2.87],
            [25.72, 0.24, 2.87, 0.22, 0.28, 3.17],
            [25.72, 0.28, 3.17, 0.34, 0.18, 3.11],
            [25.72, 0.18, 3.11, 0.47, 0.13, 2.91],
            [25.72, 0.13, 2.91, 0.58,-0.06, 2.87],
            [25.72,-0.06, 2.87, 0.69,-0.29, 2.63],
            [25.72,-0.29, 2.63, 0.79,-0.32, 2.70],
            [25.72,-0.32, 2.70, 0.90,-0.38, 2.61],
            [25.72,-0.38, 2.61, 1.00, 0.00, 0.00],
            [28.16, 0.00, 0.00, 0.00, 0.25, 2.83],
            [28.16, 0.25, 2.83, 0.10, 0.27, 2.86],
            [28.16, 0.27, 2.86, 0.20, 0.31, 3.17],
            [28.16, 0.31, 3.17, 0.31, 0.21, 3.11],
            [28.16, 0.21, 3.11, 0.43, 0.16, 2.91],
            [28.16, 0.16, 2.91, 0.53,-0.03, 2.87],
            [28.16,-0.03, 2.87, 0.63,-0.26, 2.64],
            [28.16,-0.26, 2.64, 0.72,-0.29, 2.70],
            [28.16,-0.29, 2.70, 0.82,-0.35, 2.62],
            [28.16,-0.35, 2.62, 0.91,-0.28, 2.45],
            [28.16,-0.28, 2.45, 1.00, 0.00, 0.00],
            [30.52, 0.00, 0.00, 0.00, 0.26, 2.83],
            [30.52, 0.26, 2.83, 0.09, 0.29, 2.86],
            [30.52, 0.29, 2.86, 0.19, 0.33, 3.16],
            [30.52, 0.33, 3.16, 0.29, 0.22, 3.11],
            [30.52, 0.22, 3.11, 0.39, 0.17, 2.91],
            [30.52, 0.17, 2.91, 0.49,-0.01, 2.87],
            [30.52,-0.01, 2.87, 0.58,-0.24, 2.64],
            [30.52,-0.24, 2.64, 0.67,-0.28, 2.70],
            [30.52,-0.28, 2.70, 0.76,-0.34, 2.62],
            [30.52,-0.34, 2.62, 0.84,-0.26, 2.45],
            [30.52,-0.26, 2.45, 0.92,-0.14, 2.36],
            [30.52,-0.14, 2.36, 1.00, 0.00, 0.00],
            [32.74, 0.00, 0.00, 0.00, 0.27, 2.83],
            [32.74, 0.27, 2.83, 0.09, 0.29, 2.86],
            [32.74, 0.29, 2.86, 0.17, 0.33, 3.16],
            [32.74, 0.33, 3.16, 0.27, 0.23, 3.11],
            [32.74, 0.23, 3.11, 0.37, 0.18, 2.91],
            [32.74, 0.18, 2.91, 0.45,-0.01, 2.87],
            [32.74,-0.01, 2.87, 0.54,-0.24, 2.64],
            [32.74,-0.24, 2.64, 0.62,-0.28, 2.70],
            [32.74,-0.28, 2.70, 0.71,-0.33, 2.62],
            [32.74,-0.33, 2.62, 0.79,-0.26, 2.45],
            [32.74,-0.26, 2.45, 0.86,-0.14, 2.36],
            [32.74,-0.14, 2.36, 0.93,-0.05, 2.22],
            [32.74,-0.05, 2.22, 1.00, 0.00, 0.00],
            [34.94, 0.00, 0.00, 0.00, 0.28, 2.83],
            [34.94, 0.28, 2.83, 0.08, 0.30, 2.86],
            [34.94, 0.30, 2.86, 0.16, 0.34, 3.16],
            [34.94, 0.34, 3.16, 0.25, 0.24, 3.11],
            [34.94, 0.24, 3.11, 0.34, 0.18, 2.91],
            [34.94, 0.18, 2.91, 0.43, 0.00, 2.87],
            [34.94, 0.00, 2.87, 0.51,-0.23, 2.64],
            [34.94,-0.23, 2.64, 0.58,-0.27, 2.71],
            [34.94,-0.27, 2.71, 0.66,-0.33, 2.62],
            [34.94,-0.33, 2.62, 0.74,-0.25, 2.45],
            [34.94,-0.25, 2.45, 0.81,-0.13, 2.36],
            [34.94,-0.13, 2.36, 0.87,-0.04, 2.22],
            [34.94,-0.04, 2.22, 0.94,-0.08, 2.20],
            [34.94,-0.08, 2.20, 1.00, 0.00, 0.00],
            [37.08, 0.00, 0.00, 0.00, 0.28, 2.83],
            [37.08, 0.28, 2.83, 0.08, 0.30, 2.86],
            [37.08, 0.30, 2.86, 0.15, 0.35, 3.16],
            [37.08, 0.35, 3.16, 0.24, 0.24, 3.11],
            [37.08, 0.24, 3.11, 0.32, 0.19, 2.91],
            [37.08, 0.19, 2.91, 0.40, 0.01, 2.87],
            [37.08, 0.01, 2.87, 0.48,-0.23, 2.64],
            [37.08,-0.23, 2.64, 0.55,-0.26, 2.71],
            [37.08,-0.26, 2.71, 0.62,-0.32, 2.62],
            [37.08,-0.32, 2.62, 0.69,-0.25, 2.45],
            [37.08,-0.25, 2.45, 0.76,-0.13, 2.36],
            [37.08,-0.13, 2.36, 0.82,-0.04, 2.22],
            [37.08,-0.04, 2.22, 0.88,-0.08, 2.20],
            [37.08,-0.08, 2.20, 0.94,-0.08, 2.13],
            [37.08,-0.08, 2.13, 1.00, 0.00, 0.00],
            [39.31, 0.00, 0.00, 0.00, 0.30, 2.83],
            [39.31, 0.30, 2.83, 0.07, 0.32, 2.86],
            [39.31, 0.32, 2.86, 0.14, 0.36, 3.16],
            [39.31, 0.36, 3.16, 0.23, 0.26, 3.11],
            [39.31, 0.26, 3.11, 0.30, 0.21, 2.91],
            [39.31, 0.21, 2.91, 0.38, 0.02, 2.87],
            [39.31, 0.02, 2.87, 0.45,-0.22, 2.64],
            [39.31,-0.22, 2.64, 0.52,-0.25, 2.71],
            [39.31,-0.25, 2.71, 0.59,-0.31, 2.62],
            [39.31,-0.31, 2.62, 0.65,-0.24, 2.45],
            [39.31,-0.24, 2.45, 0.72,-0.12, 2.36],
            [39.31,-0.12, 2.36, 0.78,-0.03, 2.22],
            [39.31,-0.03, 2.22, 0.83,-0.07, 2.20],
            [39.31,-0.07, 2.20, 0.89,-0.07, 2.13],
            [39.31,-0.07, 2.13, 0.94,-0.18, 2.23],
            [39.31,-0.18, 2.23, 1.00, 0.00, 0.00],
            [41.63, 0.00, 0.00, 0.00, 0.31, 2.83],
            [41.63, 0.31, 2.83, 0.07, 0.33, 2.86],
            [41.63, 0.33, 2.86, 0.14, 0.38, 3.16],
            [41.63, 0.38, 3.16, 0.21, 0.28, 3.10],
            [41.63, 0.28, 3.10, 0.29, 0.22, 2.91],
            [41.63, 0.22, 2.91, 0.36, 0.04, 2.87],
            [41.63, 0.04, 2.87, 0.43,-0.20, 2.64],
            [41.63,-0.20, 2.64, 0.49,-0.23, 2.71],
            [41.63,-0.23, 2.71, 0.55,-0.29, 2.62],
            [41.63,-0.29, 2.62, 0.62,-0.22, 2.46],
            [41.63,-0.22, 2.46, 0.68,-0.10, 2.36],
            [41.63,-0.10, 2.36, 0.73,-0.01, 2.22],
            [41.63,-0.01, 2.22, 0.79,-0.05, 2.20],
            [41.63,-0.05, 2.20, 0.84,-0.05, 2.13],
            [41.63,-0.05, 2.13, 0.89,-0.16, 2.23],
            [41.63,-0.16, 2.23, 0.94,-0.24, 2.32],
            [41.63,-0.24, 2.32, 1.00, 0.00, 0.00],
            [44.15, 0.00, 0.00, 0.00, 0.34, 2.82],
            [44.15, 0.34, 2.82, 0.06, 0.36, 2.85],
            [44.15, 0.36, 2.85, 0.13, 0.41, 3.16],
            [44.15, 0.41, 3.16, 0.20, 0.30, 3.10],
            [44.15, 0.30, 3.10, 0.27, 0.25, 2.90],
            [44.15, 0.25, 2.90, 0.34, 0.06, 2.87],
            [44.15, 0.06, 2.87, 0.40,-0.18, 2.64],
            [44.15,-0.18, 2.64, 0.46,-0.21, 2.71],
            [44.15,-0.21, 2.71, 0.52,-0.27, 2.63],
            [44.15,-0.27, 2.63, 0.58,-0.20, 2.46],
            [44.15,-0.20, 2.46, 0.64,-0.08, 2.36],
            [44.15,-0.08, 2.36, 0.69, 0.01, 2.22],
            [44.15, 0.01, 2.22, 0.74,-0.03, 2.20],
            [44.15,-0.03, 2.20, 0.79,-0.04, 2.13],
            [44.15,-0.04, 2.13, 0.84,-0.15, 2.23],
            [44.15,-0.15, 2.23, 0.89,-0.22, 2.32],
            [44.15,-0.22, 2.32, 0.94,-0.35, 2.53],
            [44.15,-0.35, 2.53, 1.00, 0.00, 0.00],
            [46.87, 0.00, 0.00, 0.00, 0.36, 2.82],
            [46.87, 0.36, 2.82, 0.06, 0.38, 2.85],
            [46.87, 0.38, 2.85, 0.12, 0.44, 3.15],
            [46.87, 0.44, 3.15, 0.19, 0.33, 3.10],
            [46.87, 0.33, 3.10, 0.25, 0.27, 2.90],
            [46.87, 0.27, 2.90, 0.32, 0.09, 2.87],
            [46.87, 0.09, 2.87, 0.38,-0.15, 2.64],
            [46.87,-0.15, 2.64, 0.43,-0.19, 2.71],
            [46.87,-0.19, 2.71, 0.49,-0.25, 2.63],
            [46.87,-0.25, 2.63, 0.55,-0.18, 2.46],
            [46.87,-0.18, 2.46, 0.60,-0.06, 2.36],
            [46.87,-0.06, 2.36, 0.65, 0.03, 2.22],
            [46.87, 0.03, 2.22, 0.70,-0.01, 2.20],
            [46.87,-0.01, 2.20, 0.75,-0.02, 2.13],
            [46.87,-0.02, 2.13, 0.79,-0.13, 2.24],
            [46.87,-0.13, 2.24, 0.84,-0.20, 2.32],
            [46.87,-0.20, 2.32, 0.89,-0.33, 2.53],
            [46.87,-0.33, 2.53, 0.94,-0.39, 2.72],
            [46.87,-0.39, 2.72, 1.00, 0.00, 0.00],
            [49.75, 0.00, 0.00, 0.00, 0.38, 2.82],
            [49.75, 0.38, 2.82, 0.06, 0.41, 2.85],
            [49.75, 0.41, 2.85, 0.11, 0.46, 3.15],
            [49.75, 0.46, 3.15, 0.18, 0.36, 3.10],
            [49.75, 0.36, 3.10, 0.24, 0.30, 2.90],
            [49.75, 0.30, 2.90, 0.30, 0.11, 2.87],
            [49.75, 0.11, 2.87, 0.36,-0.13, 2.64],
            [49.75,-0.13, 2.64, 0.41,-0.16, 2.71],
            [49.75,-0.16, 2.71, 0.46,-0.22, 2.63],
            [49.75,-0.22, 2.63, 0.52,-0.16, 2.46],
            [49.75,-0.16, 2.46, 0.57,-0.04, 2.36],
            [49.75,-0.04, 2.36, 0.61, 0.04, 2.22],
            [49.75, 0.04, 2.22, 0.66, 0.00, 2.20],
            [49.75, 0.00, 2.20, 0.70, 0.00, 2.13],
            [49.75, 0.00, 2.13, 0.74,-0.11, 2.24],
            [49.75,-0.11, 2.24, 0.79,-0.18, 2.32],
            [49.75,-0.18, 2.32, 0.84,-0.30, 2.53],
            [49.75,-0.30, 2.53, 0.89,-0.37, 2.73],
            [49.75,-0.37, 2.73, 0.94,-0.39, 2.88],
            [49.75,-0.39, 2.88, 1.00, 0.00, 0.00],
            [52.84, 0.00, 0.00, 0.00, 0.40, 2.81],
            [52.84, 0.40, 2.81, 0.05, 0.43, 2.85],
            [52.84, 0.43, 2.85, 0.11, 0.48, 3.14],
            [52.84, 0.48, 3.14, 0.17, 0.38, 3.09],
            [52.84, 0.38, 3.09, 0.23, 0.32, 2.90],
            [52.84, 0.32, 2.90, 0.28, 0.13, 2.87],
            [52.84, 0.13, 2.87, 0.33,-0.11, 2.65],
            [52.84,-0.11, 2.65, 0.38,-0.15, 2.71],
            [52.84,-0.15, 2.71, 0.44,-0.21, 2.63],
            [52.84,-0.21, 2.63, 0.49,-0.14, 2.46],
            [52.84,-0.14, 2.46, 0.53,-0.03, 2.36],
            [52.84,-0.03, 2.36, 0.58, 0.06, 2.22],
            [52.84, 0.06, 2.22, 0.62, 0.02, 2.20],
            [52.84, 0.02, 2.20, 0.66, 0.01, 2.13],
            [52.84, 0.01, 2.13, 0.70,-0.09, 2.24],
            [52.84,-0.09, 2.24, 0.74,-0.17, 2.32],
            [52.84,-0.17, 2.32, 0.79,-0.29, 2.54],
            [52.84,-0.29, 2.54, 0.84,-0.35, 2.73],
            [52.84,-0.35, 2.73, 0.89,-0.37, 2.88],
            [52.84,-0.37, 2.88, 0.94,-0.31, 3.09],
            [52.84,-0.31, 3.09, 1.00, 0.00, 0.00],
            [55.67, 0.00, 0.00, 0.00, 0.41, 2.81],
            [55.67, 0.41, 2.81, 0.05, 0.43, 2.84],
            [55.67, 0.43, 2.84, 0.10, 0.49, 3.14],
            [55.67, 0.49, 3.14, 0.16, 0.39, 3.09],
            [55.67, 0.39, 3.09, 0.21, 0.32, 2.90],
            [55.67, 0.32, 2.90, 0.27, 0.14, 2.87],
            [55.67, 0.14, 2.87, 0.32,-0.11, 2.65],
            [55.67,-0.11, 2.65, 0.36,-0.14, 2.72],
            [55.67,-0.14, 2.72, 0.41,-0.20, 2.63],
            [55.67,-0.20, 2.63, 0.46,-0.14, 2.46],
            [55.67,-0.14, 2.46, 0.51,-0.02, 2.36],
            [55.67,-0.02, 2.36, 0.55, 0.06, 2.22],
            [55.67, 0.06, 2.22, 0.59, 0.02, 2.20],
            [55.67, 0.02, 2.20, 0.63, 0.02, 2.13],
            [55.67, 0.02, 2.13, 0.67,-0.09, 2.24],
            [55.67,-0.09, 2.24, 0.71,-0.16, 2.32],
            [55.67,-0.16, 2.32, 0.75,-0.28, 2.54],
            [55.67,-0.28, 2.54, 0.79,-0.34, 2.73],
            [55.67,-0.34, 2.73, 0.84,-0.36, 2.88],
            [55.67,-0.36, 2.88, 0.89,-0.30, 3.09],
            [55.67,-0.30, 3.09, 0.95,-0.16, 2.83],
            [55.67,-0.16, 2.83, 1.00, 0.00, 0.00],
            [58.61, 0.00, 0.00, 0.00, 0.41, 2.81],
            [58.61, 0.41, 2.81, 0.05, 0.44, 2.84],
            [58.61, 0.44, 2.84, 0.10, 0.50, 3.14],
            [58.61, 0.50, 3.14, 0.15, 0.39, 3.09],
            [58.61, 0.39, 3.09, 0.20, 0.33, 2.90],
            [58.61, 0.33, 2.90, 0.25, 0.14, 2.87],
            [58.61, 0.14, 2.87, 0.30,-0.10, 2.65],
            [58.61,-0.10, 2.65, 0.35,-0.14, 2.72],
            [58.61,-0.14, 2.72, 0.39,-0.20, 2.63],
            [58.61,-0.20, 2.63, 0.44,-0.13, 2.46],
            [58.61,-0.13, 2.46, 0.48,-0.02, 2.36],
            [58.61,-0.02, 2.36, 0.52, 0.07, 2.22],
            [58.61, 0.07, 2.22, 0.56, 0.03, 2.20],
            [58.61, 0.03, 2.20, 0.60, 0.02, 2.13],
            [58.61, 0.02, 2.13, 0.63,-0.08, 2.24],
            [58.61,-0.08, 2.24, 0.67,-0.16, 2.32],
            [58.61,-0.16, 2.32, 0.71,-0.28, 2.54],
            [58.61,-0.28, 2.54, 0.75,-0.34, 2.73],
            [58.61,-0.34, 2.73, 0.80,-0.36, 2.88],
            [58.61,-0.36, 2.88, 0.85,-0.30, 3.09],
            [58.61,-0.30, 3.09, 0.90,-0.16, 2.83],
            [58.61,-0.16, 2.83, 0.95,-0.07, 2.94],
            [58.61,-0.07, 2.94, 1.00, 0.00, 0.00],
            [61.45, 0.00, 0.00, 0.00, 0.42, 2.81],
            [61.45, 0.42, 2.81, 0.05, 0.44, 2.84],
            [61.45, 0.44, 2.84, 0.09, 0.50, 3.14],
            [61.45, 0.50, 3.14, 0.14, 0.39, 3.09],
            [61.45, 0.39, 3.09, 0.19, 0.33, 2.90],
            [61.45, 0.33, 2.90, 0.24, 0.14, 2.87],
            [61.45, 0.14, 2.87, 0.29,-0.10, 2.65],
            [61.45,-0.10, 2.65, 0.33,-0.13, 2.72],
            [61.45,-0.13, 2.72, 0.37,-0.19, 2.63],
            [61.45,-0.19, 2.63, 0.42,-0.13, 2.46],
            [61.45,-0.13, 2.46, 0.46,-0.01, 2.36],
            [61.45,-0.01, 2.36, 0.50, 0.07, 2.22],
            [61.45, 0.07, 2.22, 0.53, 0.03, 2.20],
            [61.45, 0.03, 2.20, 0.57, 0.02, 2.13],
            [61.45, 0.02, 2.13, 0.60,-0.08, 2.24],
            [61.45,-0.08, 2.24, 0.64,-0.16, 2.33],
            [61.45,-0.16, 2.33, 0.68,-0.28, 2.54],
            [61.45,-0.28, 2.54, 0.72,-0.34, 2.73],
            [61.45,-0.34, 2.73, 0.76,-0.36, 2.88],
            [61.45,-0.36, 2.88, 0.81,-0.30, 3.09],
            [61.45,-0.30, 3.09, 0.86,-0.15, 2.83],
            [61.45,-0.15, 2.83, 0.91,-0.06, 2.94],
            [61.45,-0.06, 2.94, 0.95,-0.06, 2.85],
            [61.45,-0.06, 2.85, 1.00, 0.00, 0.00],
            [64.36, 0.00, 0.00, 0.00, 0.42, 2.81],
            [64.36, 0.42, 2.81, 0.04, 0.44, 2.84],
            [64.36, 0.44, 2.84, 0.09, 0.50, 3.14],
            [64.36, 0.50, 3.14, 0.14, 0.39, 3.09],
            [64.36, 0.39, 3.09, 0.18, 0.33, 2.90],
            [64.36, 0.33, 2.90, 0.23, 0.14, 2.87],
            [64.36, 0.14, 2.87, 0.27,-0.10, 2.65],
            [64.36,-0.10, 2.65, 0.32,-0.13, 2.72],
            [64.36,-0.13, 2.72, 0.36,-0.19, 2.63],
            [64.36,-0.19, 2.63, 0.40,-0.13, 2.46],
            [64.36,-0.13, 2.46, 0.44,-0.01, 2.36],
            [64.36,-0.01, 2.36, 0.47, 0.07, 2.22],
            [64.36, 0.07, 2.22, 0.51, 0.03, 2.20],
            [64.36, 0.03, 2.20, 0.54, 0.02, 2.13],
            [64.36, 0.02, 2.13, 0.58,-0.08, 2.24],
            [64.36,-0.08, 2.24, 0.61,-0.15, 2.33],
            [64.36,-0.15, 2.33, 0.65,-0.28, 2.54],
            [64.36,-0.28, 2.54, 0.69,-0.34, 2.73],
            [64.36,-0.34, 2.73, 0.73,-0.36, 2.88],
            [64.36,-0.36, 2.88, 0.77,-0.30, 3.09],
            [64.36,-0.30, 3.09, 0.82,-0.15, 2.83],
            [64.36,-0.15, 2.83, 0.87,-0.06, 2.94],
            [64.36,-0.06, 2.94, 0.91,-0.05, 2.85],
            [64.36,-0.05, 2.85, 0.95,-0.01, 2.91],
            [64.36,-0.01, 2.91, 1.00, 0.00, 0.00],
            [67.09, 0.00, 0.00, 0.00, 0.41, 2.81],
            [67.09, 0.41, 2.81, 0.04, 0.43, 2.84],
            [67.09, 0.43, 2.84, 0.08, 0.49, 3.14],
            [67.09, 0.49, 3.14, 0.13, 0.39, 3.09],
            [67.09, 0.39, 3.09, 0.18, 0.32, 2.90],
            [67.09, 0.32, 2.90, 0.22, 0.14, 2.87],
            [67.09, 0.14, 2.87, 0.26,-0.11, 2.65],
            [67.09,-0.11, 2.65, 0.30,-0.14, 2.72],
            [67.09,-0.14, 2.72, 0.34,-0.20, 2.63],
            [67.09,-0.20, 2.63, 0.38,-0.14, 2.46],
            [67.09,-0.14, 2.46, 0.42,-0.02, 2.36],
            [67.09,-0.02, 2.36, 0.45, 0.06, 2.22],
            [67.09, 0.06, 2.22, 0.49, 0.02, 2.20],
            [67.09, 0.02, 2.20, 0.52, 0.02, 2.13],
            [67.09, 0.02, 2.13, 0.55,-0.09, 2.24],
            [67.09,-0.09, 2.24, 0.59,-0.16, 2.32],
            [67.09,-0.16, 2.32, 0.62,-0.28, 2.54],
            [67.09,-0.28, 2.54, 0.66,-0.34, 2.73],
            [67.09,-0.34, 2.73, 0.70,-0.36, 2.88],
            [67.09,-0.36, 2.88, 0.74,-0.30, 3.09],
            [67.09,-0.30, 3.09, 0.79,-0.16, 2.83],
            [67.09,-0.16, 2.83, 0.83,-0.07, 2.94],
            [67.09,-0.07, 2.94, 0.87,-0.06, 2.85],
            [67.09,-0.06, 2.85, 0.92,-0.02, 2.91],
            [67.09,-0.02, 2.91, 0.96, 0.15, 2.73],
            [67.09, 0.15, 2.73, 1.00, 0.00, 0.00],
            [69.72, 0.00, 0.00, 0.00, 0.41, 2.81],
            [69.72, 0.41, 2.81, 0.04, 0.43, 2.84],
            [69.72, 0.43, 2.84, 0.08, 0.49, 3.14],
            [69.72, 0.49, 3.14, 0.13, 0.38, 3.09],
            [69.72, 0.38, 3.09, 0.17, 0.32, 2.90],
            [69.72, 0.32, 2.90, 0.21, 0.13, 2.87],
            [69.72, 0.13, 2.87, 0.25,-0.11, 2.65],
            [69.72,-0.11, 2.65, 0.29,-0.14, 2.72],
            [69.72,-0.14, 2.72, 0.33,-0.20, 2.63],
            [69.72,-0.20, 2.63, 0.37,-0.14, 2.46],
            [69.72,-0.14, 2.46, 0.40,-0.02, 2.36],
            [69.72,-0.02, 2.36, 0.44, 0.06, 2.22],
            [69.72, 0.06, 2.22, 0.47, 0.02, 2.20],
            [69.72, 0.02, 2.20, 0.50, 0.02, 2.13],
            [69.72, 0.02, 2.13, 0.53,-0.09, 2.24],
            [69.72,-0.09, 2.24, 0.56,-0.16, 2.32],
            [69.72,-0.16, 2.32, 0.60,-0.29, 2.54],
            [69.72,-0.29, 2.54, 0.63,-0.35, 2.73],
            [69.72,-0.35, 2.73, 0.67,-0.37, 2.88],
            [69.72,-0.37, 2.88, 0.71,-0.31, 3.09],
            [69.72,-0.31, 3.09, 0.76,-0.16, 2.83],
            [69.72,-0.16, 2.83, 0.80,-0.07, 2.94],
            [69.72,-0.07, 2.94, 0.84,-0.07, 2.85],
            [69.72,-0.07, 2.85, 0.88,-0.03, 2.91],
            [69.72,-0.03, 2.91, 0.92, 0.15, 2.73],
            [69.72, 0.15, 2.73, 0.96, 0.11, 2.62],
            [69.72, 0.11, 2.62, 1.00, 0.00, 0.00],
            [72.25, 0.00, 0.00, 0.00, 0.40, 2.82],
            [72.25, 0.40, 2.82, 0.04, 0.42, 2.85],
            [72.25, 0.42, 2.85, 0.08, 0.48, 3.15],
            [72.25, 0.48, 3.15, 0.12, 0.37, 3.10],
            [72.25, 0.37, 3.10, 0.16, 0.31, 2.90],
            [72.25, 0.31, 2.90, 0.20, 0.12, 2.87],
            [72.25, 0.12, 2.87, 0.24,-0.12, 2.65],
            [72.25,-0.12, 2.65, 0.28,-0.15, 2.71],
            [72.25,-0.15, 2.71, 0.32,-0.21, 2.63],
            [72.25,-0.21, 2.63, 0.36,-0.15, 2.46],
            [72.25,-0.15, 2.46, 0.39,-0.03, 2.36],
            [72.25,-0.03, 2.36, 0.42, 0.05, 2.22],
            [72.25, 0.05, 2.22, 0.45, 0.01, 2.20],
            [72.25, 0.01, 2.20, 0.48, 0.01, 2.13],
            [72.25, 0.01, 2.13, 0.51,-0.10, 2.24],
            [72.25,-0.10, 2.24, 0.54,-0.17, 2.32],
            [72.25,-0.17, 2.32, 0.58,-0.29, 2.54],
            [72.25,-0.29, 2.54, 0.61,-0.36, 2.73],
            [72.25,-0.36, 2.73, 0.65,-0.38, 2.88],
            [72.25,-0.38, 2.88, 0.69,-0.32, 3.09],
            [72.25,-0.32, 3.09, 0.73,-0.17, 2.83],
            [72.25,-0.17, 2.83, 0.77,-0.08, 2.94],
            [72.25,-0.08, 2.94, 0.81,-0.07, 2.85],
            [72.25,-0.07, 2.85, 0.85,-0.03, 2.91],
            [72.25,-0.03, 2.91, 0.89, 0.14, 2.73],
            [72.25, 0.14, 2.73, 0.93, 0.10, 2.62],
            [72.25, 0.10, 2.62, 0.96, 0.22, 2.53],
            [72.25, 0.22, 2.53, 1.00, 0.00, 0.00],
            [74.57, 0.00, 0.00, 0.00, 0.39, 2.82],
            [74.57, 0.39, 2.82, 0.04, 0.41, 2.85],
            [74.57, 0.41, 2.85, 0.08, 0.47, 3.15],
            [74.57, 0.47, 3.15, 0.12, 0.36, 3.10],
            [74.57, 0.36, 3.10, 0.16, 0.30, 2.90],
            [74.57, 0.30, 2.90, 0.20, 0.11, 2.87],
            [74.57, 0.11, 2.87, 0.24,-0.13, 2.64],
            [74.57,-0.13, 2.64, 0.27,-0.16, 2.71],
            [74.57,-0.16, 2.71, 0.31,-0.22, 2.63],
            [74.57,-0.22, 2.63, 0.34,-0.16, 2.46],
            [74.57,-0.16, 2.46, 0.38,-0.04, 2.36],
            [74.57,-0.04, 2.36, 0.41, 0.05, 2.22],
            [74.57, 0.05, 2.22, 0.44, 0.01, 2.20],
            [74.57, 0.01, 2.20, 0.47, 0.00, 2.13],
            [74.57, 0.00, 2.13, 0.50,-0.10, 2.24],
            [74.57,-0.10, 2.24, 0.53,-0.18, 2.32],
            [74.57,-0.18, 2.32, 0.56,-0.30, 2.54],
            [74.57,-0.30, 2.54, 0.59,-0.37, 2.73],
            [74.57,-0.37, 2.73, 0.63,-0.39, 2.88],
            [74.57,-0.39, 2.88, 0.67,-0.33, 3.09],
            [74.57,-0.33, 3.09, 0.71,-0.18, 2.83],
            [74.57,-0.18, 2.83, 0.75,-0.09, 2.93],
            [74.57,-0.09, 2.93, 0.79,-0.08, 2.84],
            [74.57,-0.08, 2.84, 0.82,-0.05, 2.91],
            [74.57,-0.05, 2.91, 0.86, 0.13, 2.73],
            [74.57, 0.13, 2.73, 0.90, 0.09, 2.62],
            [74.57, 0.09, 2.62, 0.93, 0.21, 2.53],
            [74.57, 0.21, 2.53, 0.97, 0.26, 2.32],
            [74.57, 0.26, 2.32, 1.00, 0.00, 0.00],
            [76.87, 0.00, 0.00, 0.00, 0.38, 2.82],
            [76.87, 0.38, 2.82, 0.04, 0.40, 2.85],
            [76.87, 0.40, 2.85, 0.07, 0.46, 3.15],
            [76.87, 0.46, 3.15, 0.11, 0.35, 3.10],
            [76.87, 0.35, 3.10, 0.15, 0.29, 2.90],
            [76.87, 0.29, 2.90, 0.19, 0.11, 2.87],
            [76.87, 0.11, 2.87, 0.23,-0.14, 2.64],
            [76.87,-0.14, 2.64, 0.26,-0.17, 2.71],
            [76.87,-0.17, 2.71, 0.30,-0.23, 2.63],
            [76.87,-0.23, 2.63, 0.33,-0.16, 2.46],
            [76.87,-0.16, 2.46, 0.37,-0.04, 2.36],
            [76.87,-0.04, 2.36, 0.40, 0.04, 2.22],
            [76.87, 0.04, 2.22, 0.43, 0.00, 2.20],
            [76.87, 0.00, 2.20, 0.45, 0.00, 2.13],
            [76.87, 0.00, 2.13, 0.48,-0.11, 2.24],
            [76.87,-0.11, 2.24, 0.51,-0.19, 2.32],
            [76.87,-0.19, 2.32, 0.54,-0.31, 2.53],
            [76.87,-0.31, 2.53, 0.57,-0.37, 2.73],
            [76.87,-0.37, 2.73, 0.61,-0.39, 2.88],
            [76.87,-0.39, 2.88, 0.65,-0.34, 3.09],
            [76.87,-0.34, 3.09, 0.69,-0.19, 2.83],
            [76.87,-0.19, 2.83, 0.72,-0.10, 2.93],
            [76.87,-0.10, 2.93, 0.76,-0.09, 2.84],
            [76.87,-0.09, 2.84, 0.80,-0.05, 2.91],
            [76.87,-0.05, 2.91, 0.84, 0.12, 2.73],
            [76.87, 0.12, 2.73, 0.87, 0.08, 2.62],
            [76.87, 0.08, 2.62, 0.91, 0.20, 2.53],
            [76.87, 0.20, 2.53, 0.94, 0.26, 2.32],
            [76.87, 0.26, 2.32, 0.97, 0.18, 2.31],
            [76.87, 0.18, 2.31, 1.00, 0.00, 0.00],
            [79.22, 0.00, 0.00, 0.00, 0.37, 2.82],
            [79.22, 0.37, 2.82, 0.04, 0.39, 2.85],
            [79.22, 0.39, 2.85, 0.07, 0.45, 3.15],
            [79.22, 0.45, 3.15, 0.11, 0.34, 3.10],
            [79.22, 0.34, 3.10, 0.15, 0.28, 2.90],
            [79.22, 0.28, 2.90, 0.19, 0.10, 2.87],
            [79.22, 0.10, 2.87, 0.22,-0.14, 2.64],
            [79.22,-0.14, 2.64, 0.26,-0.18, 2.71],
            [79.22,-0.18, 2.71, 0.29,-0.24, 2.63],
            [79.22,-0.24, 2.63, 0.32,-0.17, 2.46],
            [79.22,-0.17, 2.46, 0.36,-0.05, 2.36],
            [79.22,-0.05, 2.36, 0.39, 0.03, 2.22],
            [79.22, 0.03, 2.22, 0.41,-0.01, 2.20],
            [79.22,-0.01, 2.20, 0.44,-0.01, 2.13],
            [79.22,-0.01, 2.13, 0.47,-0.12, 2.24],
            [79.22,-0.12, 2.24, 0.50,-0.19, 2.32],
            [79.22,-0.19, 2.32, 0.53,-0.32, 2.53],
            [79.22,-0.32, 2.53, 0.56,-0.38, 2.72],
            [79.22,-0.38, 2.72, 0.59,-0.40, 2.88],
            [79.22,-0.40, 2.88, 0.63,-0.35, 3.08],
            [79.22,-0.35, 3.08, 0.67,-0.20, 2.83],
            [79.22,-0.20, 2.83, 0.70,-0.11, 2.93],
            [79.22,-0.11, 2.93, 0.74,-0.10, 2.84],
            [79.22,-0.10, 2.84, 0.78,-0.06, 2.91],
            [79.22,-0.06, 2.91, 0.81, 0.12, 2.73],
            [79.22, 0.12, 2.73, 0.85, 0.07, 2.62],
            [79.22, 0.07, 2.62, 0.88, 0.19, 2.53],
            [79.22, 0.19, 2.53, 0.91, 0.25, 2.32],
            [79.22, 0.25, 2.32, 0.94, 0.17, 2.31],
            [79.22, 0.17, 2.31, 0.97, 0.25, 2.35],
            [79.22, 0.25, 2.35, 1.00, 0.00, 0.00],
            [81.48, 0.00, 0.00, 0.00, 0.36, 2.82],
            [81.48, 0.36, 2.82, 0.03, 0.38, 2.85],
            [81.48, 0.38, 2.85, 0.07, 0.44, 3.15],
            [81.48, 0.44, 3.15, 0.11, 0.33, 3.10],
            [81.48, 0.33, 3.10, 0.15, 0.27, 2.90],
            [81.48, 0.27, 2.90, 0.18, 0.09, 2.87],
            [81.48, 0.09, 2.87, 0.22,-0.15, 2.64],
            [81.48,-0.15, 2.64, 0.25,-0.19, 2.71],
            [81.48,-0.19, 2.71, 0.28,-0.25, 2.63],
            [81.48,-0.25, 2.63, 0.32,-0.18, 2.46],
            [81.48,-0.18, 2.46, 0.35,-0.06, 2.36],
            [81.48,-0.06, 2.36, 0.37, 0.02, 2.22],
            [81.48, 0.02, 2.22, 0.40,-0.01, 2.20],
            [81.48,-0.01, 2.20, 0.43,-0.02, 2.13],
            [81.48,-0.02, 2.13, 0.45,-0.13, 2.24],
            [81.48,-0.13, 2.24, 0.48,-0.20, 2.32],
            [81.48,-0.20, 2.32, 0.51,-0.33, 2.53],
            [81.48,-0.33, 2.53, 0.54,-0.39, 2.72],
            [81.48,-0.39, 2.72, 0.58,-0.41, 2.88],
            [81.48,-0.41, 2.88, 0.61,-0.36, 3.08],
            [81.48,-0.36, 3.08, 0.65,-0.21, 2.83],
            [81.48,-0.21, 2.83, 0.68,-0.12, 2.93],
            [81.48,-0.12, 2.93, 0.72,-0.11, 2.84],
            [81.48,-0.11, 2.84, 0.75,-0.07, 2.91],
            [81.48,-0.07, 2.91, 0.79, 0.10, 2.74],
            [81.48, 0.10, 2.74, 0.82, 0.06, 2.62],
            [81.48, 0.06, 2.62, 0.86, 0.18, 2.53],
            [81.48, 0.18, 2.53, 0.89, 0.24, 2.32],
            [81.48, 0.24, 2.32, 0.92, 0.16, 2.31],
            [81.48, 0.16, 2.31, 0.94, 0.24, 2.35],
            [81.48, 0.24, 2.35, 0.97, 0.30, 2.26],
            [81.48, 0.30, 2.26, 1.00, 0.00, 0.00],
            [83.86, 0.00, 0.00, 0.00, 0.35, 2.82],
            [83.86, 0.35, 2.82, 0.03, 0.37, 2.85],
            [83.86, 0.37, 2.85, 0.07, 0.42, 3.15],
            [83.86, 0.42, 3.15, 0.11, 0.32, 3.10],
            [83.86, 0.32, 3.10, 0.14, 0.26, 2.90],
            [83.86, 0.26, 2.90, 0.18, 0.07, 2.87],
            [83.86, 0.07, 2.87, 0.21,-0.17, 2.64],
            [83.86,-0.17, 2.64, 0.24,-0.20, 2.71],
            [83.86,-0.20, 2.71, 0.27,-0.26, 2.63],
            [83.86,-0.26, 2.63, 0.31,-0.19, 2.46],
            [83.86,-0.19, 2.46, 0.34,-0.07, 2.36],
            [83.86,-0.07, 2.36, 0.36, 0.01, 2.22],
            [83.86, 0.01, 2.22, 0.39,-0.02, 2.20],
            [83.86,-0.02, 2.20, 0.42,-0.03, 2.13],
            [83.86,-0.03, 2.13, 0.44,-0.14, 2.24],
            [83.86,-0.14, 2.24, 0.47,-0.21, 2.32],
            [83.86,-0.21, 2.32, 0.50,-0.34, 2.53],
            [83.86,-0.34, 2.53, 0.53,-0.41, 2.72],
            [83.86,-0.41, 2.72, 0.56,-0.43, 2.87],
            [83.86,-0.43, 2.87, 0.59,-0.37, 3.08],
            [83.86,-0.37, 3.08, 0.63,-0.22, 2.83],
            [83.86,-0.22, 2.83, 0.66,-0.13, 2.93],
            [83.86,-0.13, 2.93, 0.70,-0.12, 2.84],
            [83.86,-0.12, 2.84, 0.73,-0.09, 2.91],
            [83.86,-0.09, 2.91, 0.77, 0.09, 2.74],
            [83.86, 0.09, 2.74, 0.80, 0.05, 2.63],
            [83.86, 0.05, 2.63, 0.83, 0.17, 2.54],
            [83.86, 0.17, 2.54, 0.86, 0.23, 2.32],
            [83.86, 0.23, 2.32, 0.89, 0.15, 2.31],
            [83.86, 0.15, 2.31, 0.92, 0.23, 2.35],
            [83.86, 0.23, 2.35, 0.94, 0.29, 2.26],
            [83.86, 0.29, 2.26, 0.97, 0.37, 2.38],
            [83.86, 0.37, 2.38, 1.00, 0.00, 0.00],
            [86.39, 0.00, 0.00, 0.00, 0.33, 2.82],
            [86.39, 0.33, 2.82, 0.03, 0.36, 2.85],
            [86.39, 0.36, 2.85, 0.07, 0.41, 3.16],
            [86.39, 0.41, 3.16, 0.10, 0.30, 3.10],
            [86.39, 0.30, 3.10, 0.14, 0.25, 2.90],
            [86.39, 0.25, 2.90, 0.17, 0.06, 2.87],
            [86.39, 0.06, 2.87, 0.21,-0.18, 2.64],
            [86.39,-0.18, 2.64, 0.24,-0.21, 2.71],
            [86.39,-0.21, 2.71, 0.27,-0.27, 2.63],
            [86.39,-0.27, 2.63, 0.30,-0.20, 2.46],
            [86.39,-0.20, 2.46, 0.33,-0.08, 2.36],
            [86.39,-0.08, 2.36, 0.35, 0.00, 2.22],
            [86.39, 0.00, 2.22, 0.38,-0.03, 2.20],
            [86.39,-0.03, 2.20, 0.40,-0.04, 2.13],
            [86.39,-0.04, 2.13, 0.43,-0.15, 2.23],
            [86.39,-0.15, 2.23, 0.45,-0.22, 2.32],
            [86.39,-0.22, 2.32, 0.48,-0.35, 2.53],
            [86.39,-0.35, 2.53, 0.51,-0.42, 2.72],
            [86.39,-0.42, 2.72, 0.54,-0.44, 2.87],
            [86.39,-0.44, 2.87, 0.58,-0.39, 3.08],
            [86.39,-0.39, 3.08, 0.61,-0.24, 2.83],
            [86.39,-0.24, 2.83, 0.64,-0.15, 2.93],
            [86.39,-0.15, 2.93, 0.68,-0.14, 2.84],
            [86.39,-0.14, 2.84, 0.71,-0.10, 2.90],
            [86.39,-0.10, 2.90, 0.74, 0.08, 2.74],
            [86.39, 0.08, 2.74, 0.78, 0.04, 2.63],
            [86.39, 0.04, 2.63, 0.81, 0.16, 2.54],
            [86.39, 0.16, 2.54, 0.84, 0.22, 2.32],
            [86.39, 0.22, 2.32, 0.86, 0.14, 2.31],
            [86.39, 0.14, 2.31, 0.89, 0.22, 2.35],
            [86.39, 0.22, 2.35, 0.92, 0.28, 2.26],
            [86.39, 0.28, 2.26, 0.94, 0.36, 2.38],
            [86.39, 0.36, 2.38, 0.97, 0.40, 2.53],
            [86.39, 0.40, 2.53, 1.00, 0.00, 0.00],
            [89.05, 0.00, 0.00, 0.00, 0.32, 2.82],
            [89.05, 0.32, 2.82, 0.03, 0.35, 2.86],
            [89.05, 0.35, 2.86, 0.06, 0.40, 3.16],
            [89.05, 0.40, 3.16, 0.10, 0.29, 3.10],
            [89.05, 0.29, 3.10, 0.13, 0.23, 2.91],
            [89.05, 0.23, 2.91, 0.17, 0.05, 2.87],
            [89.05, 0.05, 2.87, 0.20,-0.19, 2.64],
            [89.05,-0.19, 2.64, 0.23,-0.22, 2.71],
            [89.05,-0.22, 2.71, 0.26,-0.28, 2.63],
            [89.05,-0.28, 2.63, 0.29,-0.21, 2.46],
            [89.05,-0.21, 2.46, 0.32,-0.09, 2.36],
            [89.05,-0.09, 2.36, 0.34,-0.01, 2.22],
            [89.05,-0.01, 2.22, 0.37,-0.04, 2.20],
            [89.05,-0.04, 2.20, 0.39,-0.05, 2.13],
            [89.05,-0.05, 2.13, 0.42,-0.16, 2.23],
            [89.05,-0.16, 2.23, 0.44,-0.23, 2.32],
            [89.05,-0.23, 2.32, 0.47,-0.36, 2.53],
            [89.05,-0.36, 2.53, 0.50,-0.43, 2.72],
            [89.05,-0.43, 2.72, 0.53,-0.45, 2.87],
            [89.05,-0.45, 2.87, 0.56,-0.40, 3.08],
            [89.05,-0.40, 3.08, 0.59,-0.25, 2.83],
            [89.05,-0.25, 2.83, 0.62,-0.16, 2.93],
            [89.05,-0.16, 2.93, 0.66,-0.15, 2.84],
            [89.05,-0.15, 2.84, 0.69,-0.11, 2.90],
            [89.05,-0.11, 2.90, 0.72, 0.07, 2.74],
            [89.05, 0.07, 2.74, 0.75, 0.03, 2.63],
            [89.05, 0.03, 2.63, 0.78, 0.15, 2.54],
            [89.05, 0.15, 2.54, 0.81, 0.21, 2.32],
            [89.05, 0.21, 2.32, 0.84, 0.13, 2.31],
            [89.05, 0.13, 2.31, 0.86, 0.21, 2.35],
            [89.05, 0.21, 2.35, 0.89, 0.27, 2.26],
            [89.05, 0.27, 2.26, 0.91, 0.35, 2.38],
            [89.05, 0.35, 2.38, 0.94, 0.39, 2.53],
            [89.05, 0.39, 2.53, 0.97, 0.34, 2.66],
            [89.05, 0.34, 2.66, 1.00, 0.00, 0.00],
            [91.89, 0.00, 0.00, 0.00, 0.32, 2.83],
            [91.89, 0.32, 2.83, 0.03, 0.34, 2.86],
            [91.89, 0.34, 2.86, 0.06, 0.39, 3.16],
            [91.89, 0.39, 3.16, 0.10, 0.28, 3.10],
            [91.89, 0.28, 3.10, 0.13, 0.23, 2.91],
            [91.89, 0.23, 2.91, 0.16, 0.04, 2.87],
            [91.89, 0.04, 2.87, 0.19,-0.20, 2.64],
            [91.89,-0.20, 2.64, 0.22,-0.23, 2.71],
            [91.89,-0.23, 2.71, 0.25,-0.29, 2.63],
            [91.89,-0.29, 2.63, 0.28,-0.22, 2.46],
            [91.89,-0.22, 2.46, 0.31,-0.10, 2.36],
            [91.89,-0.10, 2.36, 0.33,-0.01, 2.22],
            [91.89,-0.01, 2.22, 0.36,-0.05, 2.20],
            [91.89,-0.05, 2.20, 0.38,-0.05, 2.13],
            [91.89,-0.05, 2.13, 0.40,-0.16, 2.23],
            [91.89,-0.16, 2.23, 0.43,-0.24, 2.32],
            [91.89,-0.24, 2.32, 0.45,-0.37, 2.53],
            [91.89,-0.37, 2.53, 0.48,-0.44, 2.72],
            [91.89,-0.44, 2.72, 0.51,-0.46, 2.87],
            [91.89,-0.46, 2.87, 0.54,-0.41, 3.08],
            [91.89,-0.41, 3.08, 0.57,-0.25, 2.83],
            [91.89,-0.25, 2.83, 0.61,-0.17, 2.93],
            [91.89,-0.17, 2.93, 0.64,-0.16, 2.84],
            [91.89,-0.16, 2.84, 0.67,-0.12, 2.90],
            [91.89,-0.12, 2.90, 0.70, 0.06, 2.74],
            [91.89, 0.06, 2.74, 0.73, 0.02, 2.63],
            [91.89, 0.02, 2.63, 0.76, 0.14, 2.54],
            [91.89, 0.14, 2.54, 0.79, 0.20, 2.32],
            [91.89, 0.20, 2.32, 0.81, 0.13, 2.31],
            [91.89, 0.13, 2.31, 0.84, 0.20, 2.35],
            [91.89, 0.20, 2.35, 0.86, 0.27, 2.26],
            [91.89, 0.27, 2.26, 0.89, 0.35, 2.38],
            [91.89, 0.35, 2.38, 0.91, 0.38, 2.54],
            [91.89, 0.38, 2.54, 0.94, 0.34, 2.66],
            [91.89, 0.34, 2.66, 0.97, 0.23, 2.84],
            [91.89, 0.23, 2.84, 1.00, 0.00, 0.00],
            [94.62, 0.00, 0.00, 0.00, 0.31, 2.83],
            [94.62, 0.31, 2.83, 0.03, 0.33, 2.86],
            [94.62, 0.33, 2.86, 0.06, 0.38, 3.16],
            [94.62, 0.38, 3.16, 0.09, 0.28, 3.10],
            [94.62, 0.28, 3.10, 0.13, 0.22, 2.91],
            [94.62, 0.22, 2.91, 0.16, 0.04, 2.87],
            [94.62, 0.04, 2.87, 0.19,-0.20, 2.64],
            [94.62,-0.20, 2.64, 0.22,-0.23, 2.71],
            [94.62,-0.23, 2.71, 0.24,-0.29, 2.62],
            [94.62,-0.29, 2.62, 0.27,-0.22, 2.46],
            [94.62,-0.22, 2.46, 0.30,-0.10, 2.36],
            [94.62,-0.10, 2.36, 0.32,-0.01, 2.22],
            [94.62,-0.01, 2.22, 0.35,-0.05, 2.20],
            [94.62,-0.05, 2.20, 0.37,-0.05, 2.13],
            [94.62,-0.05, 2.13, 0.39,-0.16, 2.23],
            [94.62,-0.16, 2.23, 0.42,-0.24, 2.32],
            [94.62,-0.24, 2.32, 0.44,-0.37, 2.53],
            [94.62,-0.37, 2.53, 0.47,-0.44, 2.72],
            [94.62,-0.44, 2.72, 0.50,-0.46, 2.87],
            [94.62,-0.46, 2.87, 0.53,-0.41, 3.08],
            [94.62,-0.41, 3.08, 0.56,-0.26, 2.83],
            [94.62,-0.26, 2.83, 0.59,-0.17, 2.93],
            [94.62,-0.17, 2.93, 0.62,-0.16, 2.84],
            [94.62,-0.16, 2.84, 0.65,-0.12, 2.90],
            [94.62,-0.12, 2.90, 0.68, 0.06, 2.74],
            [94.62, 0.06, 2.74, 0.71, 0.02, 2.63],
            [94.62, 0.02, 2.63, 0.74, 0.14, 2.54],
            [94.62, 0.14, 2.54, 0.76, 0.20, 2.33],
            [94.62, 0.20, 2.33, 0.79, 0.12, 2.31],
            [94.62, 0.12, 2.31, 0.81, 0.20, 2.35],
            [94.62, 0.20, 2.35, 0.84, 0.27, 2.26],
            [94.62, 0.27, 2.26, 0.86, 0.34, 2.38],
            [94.62, 0.34, 2.38, 0.89, 0.38, 2.54],
            [94.62, 0.38, 2.54, 0.91, 0.33, 2.66],
            [94.62, 0.33, 2.66, 0.94, 0.22, 2.84],
            [94.62, 0.22, 2.84, 0.97, 0.12, 2.73],
            [94.62, 0.12, 2.73, 1.00, 0.00, 0.00],
            [97.28, 0.00, 0.00, 0.00, 0.31, 2.83],
            [97.28, 0.31, 2.83, 0.03, 0.33, 2.86],
            [97.28, 0.33, 2.86, 0.06, 0.38, 3.16],
            [97.28, 0.38, 3.16, 0.09, 0.28, 3.11],
            [97.28, 0.28, 3.11, 0.12, 0.22, 2.91],
            [97.28, 0.22, 2.91, 0.15, 0.04, 2.87],
            [97.28, 0.04, 2.87, 0.18,-0.20, 2.64],
            [97.28,-0.20, 2.64, 0.21,-0.23, 2.71],
            [97.28,-0.23, 2.71, 0.24,-0.29, 2.62],
            [97.28,-0.29, 2.62, 0.26,-0.22, 2.46],
            [97.28,-0.22, 2.46, 0.29,-0.10, 2.36],
            [97.28,-0.10, 2.36, 0.31,-0.01, 2.22],
            [97.28,-0.01, 2.22, 0.34,-0.05, 2.20],
            [97.28,-0.05, 2.20, 0.36,-0.06, 2.13],
            [97.28,-0.06, 2.13, 0.38,-0.16, 2.23],
            [97.28,-0.16, 2.23, 0.40,-0.24, 2.32],
            [97.28,-0.24, 2.32, 0.43,-0.37, 2.53],
            [97.28,-0.37, 2.53, 0.45,-0.44, 2.72],
            [97.28,-0.44, 2.72, 0.48,-0.46, 2.87],
            [97.28,-0.46, 2.87, 0.51,-0.41, 3.08],
            [97.28,-0.41, 3.08, 0.54,-0.26, 2.83],
            [97.28,-0.26, 2.83, 0.57,-0.17, 2.93],
            [97.28,-0.17, 2.93, 0.60,-0.16, 2.84],
            [97.28,-0.16, 2.84, 0.63,-0.12, 2.90],
            [97.28,-0.12, 2.90, 0.66, 0.06, 2.74],
            [97.28, 0.06, 2.74, 0.69, 0.02, 2.63],
            [97.28, 0.02, 2.63, 0.72, 0.14, 2.54],
            [97.28, 0.14, 2.54, 0.74, 0.20, 2.33],
            [97.28, 0.20, 2.33, 0.77, 0.12, 2.31],
            [97.28, 0.12, 2.31, 0.79, 0.20, 2.35],
            [97.28, 0.20, 2.35, 0.81, 0.26, 2.26],
            [97.28, 0.26, 2.26, 0.84, 0.34, 2.38],
            [97.28, 0.34, 2.38, 0.86, 0.38, 2.54],
            [97.28, 0.38, 2.54, 0.89, 0.33, 2.66],
            [97.28, 0.33, 2.66, 0.92, 0.22, 2.84],
            [97.28, 0.22, 2.84, 0.94, 0.12, 2.73],
            [97.28, 0.12, 2.73, 0.97, 0.02, 2.66],
            [97.28, 0.02, 2.66, 1.00, 0.00, 0.00],
            [99.82, 0.00, 0.00, 0.00, 0.31, 2.83],
            [99.82, 0.31, 2.83, 0.03, 0.34, 2.86],
            [99.82, 0.34, 2.86, 0.06, 0.38, 3.16],
            [99.82, 0.38, 3.16, 0.09, 0.28, 3.10],
            [99.82, 0.28, 3.10, 0.12, 0.22, 2.91],
            [99.82, 0.22, 2.91, 0.15, 0.04, 2.87],
            [99.82, 0.04, 2.87, 0.18,-0.20, 2.64],
            [99.82,-0.20, 2.64, 0.20,-0.23, 2.71],
            [99.82,-0.23, 2.71, 0.23,-0.29, 2.62],
            [99.82,-0.29, 2.62, 0.26,-0.22, 2.46],
            [99.82,-0.22, 2.46, 0.28,-0.10, 2.36],
            [99.82,-0.10, 2.36, 0.31,-0.01, 2.22],
            [99.82,-0.01, 2.22, 0.33,-0.05, 2.20],
            [99.82,-0.05, 2.20, 0.35,-0.05, 2.13],
            [99.82,-0.05, 2.13, 0.37,-0.16, 2.23],
            [99.82,-0.16, 2.23, 0.39,-0.24, 2.32],
            [99.82,-0.24, 2.32, 0.42,-0.37, 2.53],
            [99.82,-0.37, 2.53, 0.44,-0.44, 2.72],
            [99.82,-0.44, 2.72, 0.47,-0.46, 2.87],
            [99.82,-0.46, 2.87, 0.50,-0.41, 3.08],
            [99.82,-0.41, 3.08, 0.53,-0.26, 2.83],
            [99.82,-0.26, 2.83, 0.56,-0.17, 2.93],
            [99.82,-0.17, 2.93, 0.59,-0.16, 2.84],
            [99.82,-0.16, 2.84, 0.62,-0.12, 2.90],
            [99.82,-0.12, 2.90, 0.64, 0.06, 2.74],
            [99.82, 0.06, 2.74, 0.67, 0.02, 2.63],
            [99.82, 0.02, 2.63, 0.70, 0.14, 2.54],
            [99.82, 0.14, 2.54, 0.72, 0.20, 2.33],
            [99.82, 0.20, 2.33, 0.75, 0.13, 2.31],
            [99.82, 0.13, 2.31, 0.77, 0.20, 2.35],
            [99.82, 0.20, 2.35, 0.79, 0.27, 2.26],
            [99.82, 0.27, 2.26, 0.82, 0.34, 2.38],
            [99.82, 0.34, 2.38, 0.84, 0.38, 2.54],
            [99.82, 0.38, 2.54, 0.87, 0.33, 2.66],
            [99.82, 0.33, 2.66, 0.89, 0.23, 2.84],
            [99.82, 0.23, 2.84, 0.92, 0.12, 2.73],
            [99.82, 0.12, 2.73, 0.95, 0.02, 2.66],
            [99.82, 0.02, 2.66, 0.97,-0.05, 2.55],
            [99.82,-0.05, 2.55, 1.00, 0.00, 0.00],
            [102.41, 0.00, 0.00, 0.00, 0.32, 2.83],
            [102.41, 0.32, 2.83, 0.03, 0.34, 2.86],
            [102.41, 0.34, 2.86, 0.06, 0.39, 3.16],
            [102.41, 0.39, 3.16, 0.09, 0.28, 3.10],
            [102.41, 0.28, 3.10, 0.12, 0.23, 2.91],
            [102.41, 0.23, 2.91, 0.15, 0.04, 2.87],
            [102.41, 0.04, 2.87, 0.17,-0.20, 2.64],
            [102.41,-0.20, 2.64, 0.20,-0.23, 2.71],
            [102.41,-0.23, 2.71, 0.23,-0.29, 2.63],
            [102.41,-0.29, 2.63, 0.25,-0.22, 2.46],
            [102.41,-0.22, 2.46, 0.27,-0.10, 2.36],
            [102.41,-0.10, 2.36, 0.30,-0.01, 2.22],
            [102.41,-0.01, 2.22, 0.32,-0.05, 2.20],
            [102.41,-0.05, 2.20, 0.34,-0.05, 2.13],
            [102.41,-0.05, 2.13, 0.36,-0.16, 2.23],
            [102.41,-0.16, 2.23, 0.38,-0.24, 2.32],
            [102.41,-0.24, 2.32, 0.41,-0.37, 2.53],
            [102.41,-0.37, 2.53, 0.43,-0.44, 2.72],
            [102.41,-0.44, 2.72, 0.46,-0.46, 2.87],
            [102.41,-0.46, 2.87, 0.49,-0.41, 3.08],
            [102.41,-0.41, 3.08, 0.52,-0.25, 2.83],
            [102.41,-0.25, 2.83, 0.54,-0.17, 2.93],
            [102.41,-0.17, 2.93, 0.57,-0.16, 2.84],
            [102.41,-0.16, 2.84, 0.60,-0.12, 2.90],
            [102.41,-0.12, 2.90, 0.63, 0.06, 2.74],
            [102.41, 0.06, 2.74, 0.65, 0.02, 2.63],
            [102.41, 0.02, 2.63, 0.68, 0.14, 2.54],
            [102.41, 0.14, 2.54, 0.71, 0.20, 2.32],
            [102.41, 0.20, 2.32, 0.73, 0.13, 2.31],
            [102.41, 0.13, 2.31, 0.75, 0.21, 2.35],
            [102.41, 0.21, 2.35, 0.77, 0.27, 2.26],
            [102.41, 0.27, 2.26, 0.80, 0.35, 2.38],
            [102.41, 0.35, 2.38, 0.82, 0.38, 2.53],
            [102.41, 0.38, 2.53, 0.84, 0.34, 2.66],
            [102.41, 0.34, 2.66, 0.87, 0.23, 2.84],
            [102.41, 0.23, 2.84, 0.90, 0.13, 2.73],
            [102.41, 0.13, 2.73, 0.92, 0.02, 2.66],
            [102.41, 0.02, 2.66, 0.95,-0.04, 2.55],
            [102.41,-0.04, 2.55, 0.97,-0.14, 2.59],
            [102.41,-0.14, 2.59, 1.00, 0.00, 0.00]]
    };
};

// ------- Attach Sketch to canvas --------
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketch);