let locations = ['head', 'butt', 'left_side', 'right_side', 'left_butt', 'right_butt'];

class Worm {
    constructor(x, y) {
        this.origin_x = x;
        this.origin_y = y;
        this.p = new Vector(x, y);
        this.r = 0;
        this.v = new Vector();
        this.old_v = new Vector();
        this.a = new Vector();
        this.brain = null;
        this.hitbox = new Hitbox(x, y, UNIT, UNIT * 2);
        this.hitbox.config.rotation = 'center';
        this.energy = 100;
        this.fitness = 0;
        this.isTurning = false;
        this.isWalking = false;
        this.walkCooldown = 2;
        this.restNeeded = 2;
        this.turnTarget = 0;
        this.currentBehaviour = 'randomWalk';
        this.dead = false;
        this.bounds = {
            x1: 0,
            x2: width || 0,
            y1: 0,
            y2: height || 0,
        };
        this.appendages = [];
        this.MAX_ENERGY = 100;
        this.CRITICAL_LOW_ENERGY = 20;


        this.inputToggles = {
            random: false,
            speed: true,
            rotation: true,
            energy: true,
            body_feel: true, //something in the hitbox
            num_of_appendages: false,
            x_position: false,
            y_position: false,
            constant: true,
        };

        this.outputToggles = {
            moveFwd: true,
            turnLeft: true,
            turnRight: true,
            eat: true,
            breed: false,
            moveBkwd: false,
            changeBehaviour: false,
        };
        this.brain = {};
    }

    init(){
        this.brain = this.createBrain();
    }

    update(dt) {
        if (this.dead) return;
        //behaviour
        this.doBehaviour();

        //thinking

        this.handleThoughts( this.think());

        //turning
        if (this.isTurning) this.doTurn();
        //movement
        //walk cooldown
        if (this.isWalking) {
            this.walkCooldown -= dt / 1000;
            if (this.walkCooldown <= 0) {
                this.isWalking = false;
            }
        }
        //dt scaling to make the numbers kinda work well
        dt = dt / (UNIT * 3);
        this.a.add(this.a.copy().mult(-2 * FRICTION_COEFF));
        this.v.add(this.a.copy().mult(dt));
        this.v.add(this.v.copy().mult(-1 * FRICTION_COEFF));
        let real_v = this.v.copy().add(this.old_v).div(2);
        real_v.mult(dt).limit(SPEED_LIMIT);
        this.p.add(real_v);
        if (this.v.mag() < 0.01) this.v.floor();
        if (this.a.mag() < 0.01) this.a.floor();
        this.old_v = this.v.copy();
        this.handleOOB();

        //move hitbox
        this.hitbox.rotateTo(this.r);
        this.hitbox.moveTo(this.p.copy());

        //move appendages
        this.appendages.forEach(appendage => {
            appendage.update(this.p, this.r)
        });

        //handle energy
        if (this.energy > this.MAX_ENERGY) {
            if (this.appendages.map(x => x.name).filter(x => x === 'fat').length) {
                let needToAllocate = this.energy - this.MAX_ENERGY;
                this.energy = this.MAX_ENERGY;
                this.allocateFat(needToAllocate);
            } else {
                this.addFat();
            }
        }
        if(this.energy < this.CRITICAL_LOW_ENERGY){
            this.energy += this.getEnergyFromFat(10); //TODO maybe not 10
        }

        //handle energy loss and fitness
        this.energy -= TICK_DECAY
        this.fitness += TICK_DECAY/5;


        //die if no energy
        if (this.energy <= 0) this.die();
    }

    addFat() {
        if(this.energy<=10) return;
        this.energy -= 10; //TODO starting fat energy num
        let newFat = Appendage.create('fat');
        let newLocation = this.getFreeAppendageLocation();
        if (newLocation) {
            this.addAppendage(newFat, newLocation);
            return true;
        }
        return false;
    }

    allocateFat(number) {
        if(number === 0) return;
        let allFat = this.appendages.filter(x => x.name === 'fat');
        allFat.forEach(fat => {
            if (!fat.full && number>0) {
                number = fat.addEnergy(number);
            }
        });
        if (number > 0) {
            if(this.addFat()){
                this.energy += number;
                console.log('energy is at ' + this.energy)
            }
        }

    }

    getEnergyFromFat(number){
        let allFat = this.appendages.filter(x => x.name === 'fat');
        if(allFat.length === 0) return 0;
        let taken = 0;
        let needed = number;
        allFat.forEach(fat => {
            if (!fat.dead && taken<=number) {
                //.getEnergy returns max possible to give, so any remainder needed must be accounted for
                taken += fat.getEnergy(needed);
                needed -= taken;
            }
        });
        return taken;
    }

    TEMPFLASH(){
        this.TEMPGFX.shape.set('backgroundColor', 'blue')
    }

    getFreeAppendageLocation() {
        let usedLocations = this.appendages.map(x => x.location);
        let freeLocations = locations.filter(x => !usedLocations.includes(x));
        let targetLocation = null;

        if (freeLocations.length) {
            targetLocation = getRandom(freeLocations);
        }
        return targetLocation;
    }

    turn(deg) {
        if (!this.isTurning) {
            this.turnTarget = this.r + deg;
            this.isTurning = true;
        }
    }

    doTurn() {
        if (!this.isTurning) return;
        if (Math.abs(this.turnTarget - this.r) < 1) {
            this.r = this.turnTarget;
            this.isTurning = false;
            return;
        }
        this.r = (this.r + this.turnTarget) / 2;
    }

    walk(strength) {
        if (this.isWalking) return;
        if (!strength) strength = 0;
        this.energy -= strength;
        this.fitness += strength/4; //TODO maybe not ok?
        let direction = Vector.fromAngle(this.r).mult(strength);
        this.a.add(direction);
        this.isWalking = true;
        this.walkCooldown = this.restNeeded;
    }

    doBehaviour() {
        // 'random walk'
        switch (this.currentBehaviour) {
            case 'randomWalk':
                if (Math.random() > 0.99) this.walk(1);
                if (Math.random() > 0.95) this.turn(getRandom(-20, 20));
                if (Math.random() > 0.97) {
                    let food = FOODQUAD.query(this.p.x, this.p.y, UNIT * 3).map(x => x.data);
                    let potential = this.eat(food);
                }
                break;
            case 'rotate':
                this.turn(5);
                break;
            case 'moveForeward':
                this.walk(1);
                break;
            default:
        }
    }

    die() {
        this.dead = true;
    }


    createBrain(){
        let brain = new NeuralNetwork(this.calculateInputs());
        //the following also might be controlled by dna idk
        let layerConfig = {
            layers: 3,
            nodes: this.calculateInputs()+3,
            activation0: 'sigmoid',
            activation1: 'relu',
            activation2: 'relu',
        };
        for(let i = 0; i<layerConfig.layers; i++){
            brain.addLayer(layerConfig.nodes,'dense', {activation_fn:layerConfig['activation'+i]})
        }

        //outputs might be different later on due to outputable appendages
        brain.addLayer(this.calculateOutputs(),'dense', {activation_fn:'relu'});
        brain.init();
        brain.randomizeAll();
        return brain;
    }

    calculateInputs(){
        //in the future they may have a lot of eyes or something idk
        let inputs = 0;
        //counts how many appendages have an input to care about
        inputs += this.appendages.filter(x => x.hasInput).length;

        //next few might be controlled later on by their dna idk
        //here would be the code that conrolls the input toggles


        // counts the number of true in the top object and sums them and adds to inputs
        inputs += Object.values(this.inputToggles).reduce((tot,a)=>tot+(a?1:0),0);
        return inputs;
    }

    calculateOutputs(){
        let outputs = 0;

        //same as above
        outputs += this.appendages.filter(x => x.hasOutput).length;

        //here would be the code that conrolls the output toggles

        outputs += Object.values(this.outputToggles).reduce((tot,a)=>tot+(a?1:0),0);
        return outputs;

    }
    think(){
        let inputs = [];

        /*
        #   should start with ones that will mostly always be true, end with inputs
        #   0 - speed
        #   1 - rotation
        #   2 - energy
        #   3 - body feel
        #   4 - constant
        #   5 - random
        #   6,7 - x y positions
        #   8+ inputs
         */

        //needed more than once here so optimized
        let nearbyFood = FOODQUAD.query(this.p.x,this.p.y,UNIT*3).map(x=>x.data);

        if(this.inputToggles.speed){
            inputs.push(this.v.copy().mag()/SPEED_LIMIT) //normalized
        }
        if(this.inputToggles.rotation){
            //rotation away from north? //TODO
            let angle = (this.r%360 -180)/180;
            inputs.push(angle)
        }
        if(this.inputToggles.energy){
            inputs.push(this.energy/this.MAX_ENERGY);
        }
        if(this.inputToggles.body_feel){
            let stuffIsThere = this.feelForThings(nearbyFood).length>0?1:0;
            inputs.push(stuffIsThere);
        }
        if(this.inputToggles.constant){
            inputs.push(1);
        }
        if(this.inputToggles.random){
            inputs.push(Math.random())
        }
        if(this.inputToggles.x_position){
            inputs.push(Math.abs(this.p.x-(width/2))/width) //distance from center
        }
        if(this.inputToggles.y_position){
            inputs.push(Math.abs(this.p.y-(height/2))/height) //distance from center
        }

        this.appendages.filter(x=>x.hasInput).forEach(part=>{
            let canSeeStuff = part.use(nearbyFood).length>0?1:0;
            inputs.push(canSeeStuff);
        });
        return this.brain.predict(inputs);
    }

    handleThoughts(outputArray){
        /*
      #     this.outputToggles = {
            moveFwd: true,
            turnLeft: true,
            turnRight: true,
            eat: true,
            breed: false,
            moveBkwd: false,
            changeBehaviour: false,
        };
       */
        //needs to stay in order

        let order = ['moveFwd', 'turnLeft', 'turnRight', 'eat', 'moveBkwd', 'changeBehaviour', ];

        outputArray.forEach((output,i)=>{
            if(this.outputToggles[order[i]]){
                switch(order[i]){
                    case 'moveFwd':
                        if(output>0.5){
                            this.walk(2)
                        }
                        break;
                    case 'turnLeft':
                        if(output>0.3){
                            this.turn(-60*output);
                        }
                        break;
                    case 'turnRight':
                        if(output>0.3){
                            this.turn(60*output);
                        }
                        break;
                    case 'eat':
                        if(output>0.1){
                            this.eat(FOODQUAD.query(this.p.x,this.p.y,UNIT*3).map(x=>x.data))
                        }
                        break;
                    case 'moveBkwd':
                        //TODO
                        break;
                    case 'changeBehaviour':
                        //TODO
                        break;
                }
            }
        })











    }

    feelForThings(arrayOfObjects){
        //TODO need to figure out what things are feelable
        let felt = [];
        arrayOfObjects.forEach(point=>{
            if(this.hitbox.contains(point))
                felt.push(point)
            }
        );
        return felt;
    }

    handleOOB() {
        if (this.p.x < this.bounds.x1) this.p.x = this.bounds.x1;
        if (this.p.x > this.bounds.x2) this.p.x = this.bounds.x2;
        if (this.p.y < this.bounds.y1) this.p.y = this.bounds.y1;
        if (this.p.y > this.bounds.y2) this.p.y = this.bounds.y2;
    }

    eat(arrayOfPoints) {
        let potentials = [];
        arrayOfPoints.forEach(point => {
            if (point instanceof FoodPiece) {
                if (this.hitbox.contains(point.p)) {
                    if (!point.eaten) potentials.push(point);
                }
            } else {
                console.error(`[worm] I can't eat a ${point}`)
            }

        });
        if (potentials.length > 0) {
            let eaten = getRandom(potentials);
            eaten.eaten = true;
            this.energy += eaten.energy;
            this.fitness += eaten.energy;
            return eaten;
        } else {
            return null
        }

    }


    addAppendage(appendage, location) {
        if (typeof appendage === 'string') {
            appendage = Appendage.create(appendage)
        }
        if(location === 'random'){
            location = this.getFreeAppendageLocation();
        }
        if(this.getFreeAppendageLocation() === null) {
            console.log(`[worm] theres no room for a new appendage`)
            return;
        }
        appendage.p = this.p;
        appendage.r = this.r;
        appendage.setLocation(location);
        this.appendages.push(appendage);
    }

    removeAppendage(name, location) {
        if (this.appendages.length < 1) {
            console.log(`[worm] I don't have any appendages to remove`);
            return;
        }
        if (name === 'random') {
            let lost = this.appendages.splice(Math.random() * this.appendages.length | 0, 1);
            console.log(`[worm] My ${lost.name} was removed from my ${lost.location}`);
            return;
        }
        let appendage = this.appendages.filter(part => {
            return part.name === name && part.location === location
        });
        if (appendage.length > 0) {
            this.appendages.splice(this.appendages.indexOf(appendage[0]), 1);
            appendage[0].remove();
            console.log(`[worm] My ${appendage[0].name} was removed from my ${appendage[0].location}`);
        } else {
            console.log(`[worm] I dont have a(n) ${name} on my ${location}`);
        }
    }


    getFitness(){
        return this.fitness**2;
    }

    copy(){
        let worm = new Worm(this.origin_x,this.origin_y);
        worm.brain = this.brain.copy();
        this.appendages.forEach(part=>{
            //TODO dictated by dna
            if(part.hasInput){
                worm.addAppendage(part.name,part.location);
            }
        });
        worm.currentBehaviour = this.currentBehaviour;
        return worm
    }


}