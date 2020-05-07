class EventEmitter{
    constructor(){
        this.events = {}
    }
    subscribe(eventName, fn){
        if(!this.events[eventName]){
            this.events[eventName] = [];
        }
        this.events[eventName].push(fn);
        return ()=>{
            this.events[eventName] = this.events[eventName].filter(eventFn=>fn!== eventFn)
        }
    }
    done(fn){
        if(!this.events.done){
            this.events.done = {};
        }
        this.events.done = fn;
    }
    emit(eventName, data){
        const event = this.events[eventName];
        if(event){
            event.forEach(fn=>{
                fn.call(null, data);
            })
        }
    }
    emitDone(data){
        const event = this.events.done;
        if(event){
                event.call(null,data);
        }
        delete this.events.done;
    }
}
