class MemoryPiece{ //TODO perhaps can delete this
    constructor(vector,name){
        this.location = vector;
        this.name = name;
    }
}
class FoodPiece{
    constructor(vector, size){
        this.p = vector;
        this.energy = size;
        this.eaten = false;
    }
}