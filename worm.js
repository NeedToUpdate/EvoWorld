let locations = ['head', 'butt', 'left_side', 'right_side', 'left_butt', 'right_butt'];
let DNAstructure = [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1];

/*
eye num 1
eye location 2
cooldown 1

#inputs#

speed 1
rotation: 1
body_feel: 1
energy: 1
inverse_energy: 1
constant: 1
random: 1
num_of_appendages: 1
x_position: 1
y_position: 1

max energy 2

#outputs#

moveFwd: 1,
turnLeft: 1,
turnRight: 1,
eat: 1,

#layer config#

layers: 1,
nodes: 1,
activation0: 1,
activation1: 1,
activation2: 1,

 */

class Worm {
    constructor(x, y) {
        this.origin_x = x;
        this.origin_y = y;
        this.p = new Vector(x, y);
        this.old_p = this.p.copy();
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
        this.currentBehaviour = '';
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
        this.isDnaParsed = false;

        this.inputToggles = {
            speed: true,
            rotation: false,
            energy: true,
            inverse_energy: true,
            body_feel: true, //something in the hitbox
            constant: true,
            random: true,
            num_of_appendages: false,
            x_position: false,
            y_position: false,
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

        this.layerConfig = {
            layers: 1,
            nodes: this.calculateInputs() + 1,
            activation0: 'relu',
            activation1: 'relu',
            activation2: 'relu',
        };
        this.DNA = {};
        this.brain = {};
    }

    init() {
        if (!this.isDnaParsed) {
            this.DNA = this.createDNA();
            this.parseDNA();
        }
        if (Object.keys(this.brain).length === 0) this.brain = this.createBrain();
    }

    update(dt) {
        if (this.dead) return;
        //behaviour
        this.doBehaviour();

        //thinking

        this.handleThoughts(this.think());

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
        //dt is from like 3 to 20
        let a_fric = this.a.copy().mult(-2 * FRICTION_COEFF * Math.sqrt(dt));
        if(a_fric.mag()>this.a.mag()) {
            this.a.clear()
        }else{
            this.a.add(a_fric);
        }
        this.v.add(this.a.copy().mult(dt));
        let v_fric = this.v.copy().mult(-1 * FRICTION_COEFF * Math.sqrt(dt));
        if(v_fric.mag()>this.v.mag()) {
            this.v.clear()
        }else{
            this.v.add(v_fric);
        }
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
        if (this.energy < this.CRITICAL_LOW_ENERGY) {
            this.energy += this.getEnergyFromFat(10); //TODO maybe not 10
        }

        //handle energy loss and fitness
        this.energy -= TICK_DECAY;
        //this.fitness += TICK_DECAY/5;
        let d = this.old_p.dist(this.p);
        //this.fitness += d/400;
        this.old_p = this.p.copy();


        //die if no energy
        if (this.energy <= 0) this.die();
    }

    addFat() {
        if (this.energy <= 10) return;
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
        if (number === 0) return;
        let allFat = this.appendages.filter(x => x.name === 'fat');
        allFat.forEach(fat => {
            if (!fat.full && number > 0) {
                number = fat.addEnergy(number);
            }
        });
        if (number > 0) {
            if (this.addFat()) {
                this.energy += number;
                console.log('energy is at ' + this.energy)
            }
        }

    }

    getEnergyFromFat(number) {
        let allFat = this.appendages.filter(x => x.name === 'fat');
        if (allFat.length === 0) return 0;
        let taken = 0;
        let needed = number;
        allFat.forEach(fat => {
            if (!fat.dead && taken <= number) {
                //.getEnergy returns max possible to give, so any remainder needed must be accounted for
                taken += fat.getEnergy(needed);
                needed -= taken;
            }
        });
        return taken;
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
        let direction = Vector.fromAngle(this.r).mult(strength);
        this.a.add(direction);
        this.isWalking = true;
        this.walkCooldown = this.restNeeded * (this.MAX_ENERGY - this.energy) / this.MAX_ENERGY;
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


    createBrain() {
        let brain = new NeuralNetwork(this.calculateInputs());
        //the following also might be controlled by dna idk

        for (let i = 0; i < this.layerConfig.layers; i++) {
            brain.addLayer(this.layerConfig.nodes, 'dense', {activation_fn: this.layerConfig['activation' + i]})
        }

        //outputs might be different later on due to outputable appendages
        brain.addLayer(this.calculateOutputs(), 'dense', {activation_fn: 'relu'});
        brain.init();
        brain.randomizeAll();
        return brain;
    }

    calculateInputs() {
        //in the future they may have a lot of eyes or something idk
        let inputs = 0;
        //counts how many appendages have an input to care about
        inputs += this.appendages.filter(x => x.hasInput).length;

        //next few might be controlled later on by their dna idk
        //here would be the code that conrolls the input toggles


        // counts the number of true in the top object and sums them and adds to inputs
        inputs += Object.values(this.inputToggles).reduce((tot, a) => tot + (a ? 1 : 0), 0);
        //TODO variable brains
        return 11;
    }

    calculateOutputs() {
        let outputs = 0;

        //same as above
        outputs += this.appendages.filter(x => x.hasOutput).length;

        //here would be the code that conrolls the output toggles

        outputs += Object.values(this.outputToggles).reduce((tot, a) => tot + (a ? 1 : 0), 0);
        //TODO variable brains
        return 4;

    }

    think() {
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
        let nearbyFood = FOODQUAD.query(this.p.x, this.p.y, UNIT * 6);

        if (this.inputToggles.speed) {
            inputs.push(this.v.copy().mag() / SPEED_LIMIT) //normalized
        }
        if (this.inputToggles.rotation) {
            //rotation away from north? //TODO
            let angle = 1 - Math.abs(this.r % 360 - 180) / 180;
            inputs.push(angle)
        }
        if (this.inputToggles.energy) {
            inputs.push(this.energy / this.MAX_ENERGY);
        }
        if (this.inputToggles.inverse_energy) {
            inputs.push((this.MAX_ENERGY - this.energy) / this.MAX_ENERGY);
        }
        if (this.inputToggles.body_feel) {
            let stuffIsThere = this.feelForThings(nearbyFood).length > 0 ? 1 : 0;
            inputs.push(stuffIsThere);
        }
        if (this.inputToggles.constant) {
            inputs.push(1);
        }
        if (this.inputToggles.random) {
            inputs.push(Math.random())
        }
        if (this.inputToggles.x_position) {
            inputs.push(Math.abs(this.p.x - (width / 2)) / width) //distance from center
        }
        if (this.inputToggles.y_position) {
            inputs.push(Math.abs(this.p.y - (height / 2)) / height) //distance from center
        }
        if (this.inputToggles.num_of_appendages) {
            inputs.push(this.appendages.length / 6) //uhh not sure TODO
        }
        this.appendages.filter(x => x.hasInput).forEach(part => {
            let canSeeStuff = part.use(nearbyFood).length > 0 ? 1 : 0;
            if (PLZLOG) {
                console.log(canSeeStuff, nearbyFood, part.use(nearbyFood));
                PLZLOG = false;
            }
            inputs.push(canSeeStuff);
        });

        //TODO variable brains
        while (inputs.length < 11) {
            inputs.push(0);
        }

        return this.brain.predict(inputs);
    }

    handleThoughts(outputArray) {
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

        let order = ['moveFwd', 'turnLeft', 'turnRight', 'eat', 'moveBkwd', 'changeBehaviour',];

        outputArray.forEach((output, i) => {
            if (this.outputToggles[order[i]]) {
                switch (order[i]) {
                    case 'moveFwd':
                        if (output > 0.3) {
                            this.walk(3 * output)
                        }
                        break;
                    case 'turnLeft':
                        if (output > 0.4) {
                            this.turn(-60 * (output-0.4));
                        }
                        break;
                    case 'turnRight':
                        if (output > 0.4) {
                            this.turn(60 * (output-0.4));
                        }
                        break;
                    case 'eat':
                        if (output > 0.01) {
                            this.eat(FOODQUAD.query(this.p.x, this.p.y, UNIT * 3).map(x => x.data))
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

    feelForThings(arrayOfObjects) {
        //TODO need to figure out what things are feelable
        let felt = [];
        arrayOfObjects.forEach(point => {
                if (this.hitbox.contains(point))
                    felt.push(point)
            }
        );
        return felt;
    }

    handleOOB() {
        if (this.p.x < this.bounds.x1) {
            this.p.x = this.bounds.x1;
            this.energy -= 1;
            this.fitness -= 0.01;
        }
        if (this.p.x > this.bounds.x2) {
            this.p.x = this.bounds.x2;
            this.energy -= 1;
            this.fitness -= 0.01;
        }
        if (this.p.y < this.bounds.y1) {
            this.p.y = this.bounds.y1;
            this.energy -= 1;
            this.fitness -= 0.01;
        }
        if (this.p.y > this.bounds.y2) {
            this.p.y = this.bounds.y2;
            this.energy -= 1;
            this.fitness -= 0.01;
        }
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
            this.energy += eaten.energy * 2;
            this.fitness += eaten.energy * 1.1;
            return eaten;
        } else {
            return null
        }

    }


    addAppendage(appendage, location) {
        if (typeof appendage === 'string') {
            appendage = Appendage.create(appendage)
        }
        if (location === 'random') {
            location = this.getFreeAppendageLocation();
        }
        if (this.getFreeAppendageLocation() === null) {
            console.log(`[worm] theres no room for a new appendage`);
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


    getFitness() {
        return this.fitness > 0 ? this.fitness ** 2 : 0;
    }

    copy() {
        let worm = new Worm(this.origin_x, this.origin_y);
        worm.DNA = this.DNA.copy();
        worm.parseDNA();
        worm.brain = this.brain.copy();
        return worm
    }

    setP(vector) {
        //since travel distance is needed for fitness, old_p and p must be the same on start
        this.p = vector.copy();
        this.old_p = vector.copy();
    }

    log() {
        console.group('worm');
        console.log('Energy: ' + this.energy);
        console.log('Fitness: ' + this.fitness);
        console.log('CooldownNeeded: ' + this.restNeeded);
        console.log('inputs', this.inputToggles);
        console.log('outputs', this.outputToggles);
        console.log('layers', this.layerConfig);
        console.groupEnd()
    }

    createDNA() {
        return new DNA(DNAstructure);
    }

    parseDNA() {
        //this should be run first before anything else
        let dna = this.DNA.values.map(x => parseInt(x, 16));
        let debug = false;
        //
        // eye num 1
        //1-3 eyes are needed so;
        let eyeNum = 2; //TODO relative brain mixing
        if (debug) console.log('eyenum', eyeNum);
        // eye location 2
        let locs = [];
        let locsLog = [];
        let nums = [5, 2, 3, 1, 4]; //guaranteed random
        for (let i = 0; i < eyeNum; i++) {
            //get a random value from that above array, splice it out, find the corresponding location
            let loc = locations[nums.splice(dna[2] % (nums.length - 1), 1)[0]];
            locs.push((i===0)?'head':loc);
            locsLog.push(i)
            //TODO for now first eye will always be on head
        }
        if (debug) console.log('locs', locs, locsLog);
        for (let i = 0; i < eyeNum; i++) {
            this.addAppendage('eye', locs[i]);
        }
        // cooldown 1
        this.restNeeded = dna[2] % 5 + 1;
        if (debug) console.log('restNeeded', this.restNeeded);
        //
        // #inputs#
        //
        // speed 1
        // rotation: 1
        // body_feel: 1
        // energy: 1
        // inverse_energy: 1
        // constant: 1
        // random: 1
        // num_of_appendages: 1
        // x_position: 1
        // y_position: 1
        // percentages will vary due to importance of some of these
        this.inputToggles = {
            speed: dna[3] > 3,
            rotation: dna[4] > 7,
            energy: dna[5] > 7,
            inverse_energy: dna[6] > 7,
            body_feel: dna[7] > 2, //something in the hitbox
            constant: dna[8] > 7,
            random: dna[9] > 7,
            num_of_appendages: false, //10 TODO
            x_position: dna[11] > 10, //11
            y_position: dna[12] > 10, //12
        };
        if (debug) console.log('this.inputToggles', this.inputToggles);
        //
        // max energy 2
        this.MAX_ENERGY = (dna[13] / 255) * 100;
        if (debug) console.log(' this.MAX_ENERGY ', this.MAX_ENERGY);
        //
        // #outputs#
        //
        // moveFwd: 1,
        // turnLeft: 1,
        // turnRight: 1,
        // eat: 1,
        //
        this.outputToggles = {
            moveFwd: dna[14] > 1,
            turnLeft: dna[15] > 2,
            turnRight: dna[16] > 2,
            eat: dna[17] > 1,
            breed: false,
            moveBkwd: false,
            changeBehaviour: false,
        };

        if (debug) console.log(' this.outputToggles ', this.outputToggles);
        // #layer config#
        //
        // layers: 1,
        // nodes: 1,
        // activation0: 1,
        // activation1: 1,
        // activation2: 1,

        this.layerConfig = {
            layers: 1, //TODO relative brain mixing
            nodes: this.calculateInputs() + 2,
            activation0: dna[20] > 7 ? 'relu' : 'sigmoid',
            activation1: dna[21] > 7 ? 'relu' : 'sigmoid',
            activation2: dna[22] > 7 ? 'relu' : 'sigmoid',
        };
        if (debug) console.log(' this.layerConfig ', this.layerConfig);
        this.isDnaParsed = true;
    }

}