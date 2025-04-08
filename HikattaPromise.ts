
export type HikattaPromiseStatus = 'pending' | 'fulfilled' | 'rejected';

class HikattaPromise {
    private status:HikattaPromiseStatus='pending';
    private value: any;
    
    constructor(private executor: (resolve?: (value: any) => void, reject?: (reason: any) => void) => void) {
        try{
            this.executor(this.resolve.bind(this), this.reject.bind(this));
        }catch(e){
            this.changeStatus('rejected',e)
        }

    }


    private resolve(value: any) {
        this.changeStatus('fulfilled',value)
    }
    private reject(reason:any){
        this.changeStatus('rejected',reason)
    }

    private changeStatus(status:HikattaPromiseStatus,value:any){
        if(this.status!=='pending'){
            return
        }
        this.status=status
        this.value=value
    }
}
