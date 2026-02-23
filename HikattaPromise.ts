
/**
 * HikattaPromise 状态类型
 * - pending: 初始状态
 * - fulfilled: 操作成功完成
 * - rejected: 操作失败
 */
export type HikattaPromiseStatus = 'pending' | 'fulfilled' | 'rejected';

/**
 * PromiseLike 接口，定义了具有 then 方法的对象
 */
export type PromiseLike = {
    then: (onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) => any;
};

/**
 * HikattaPromise 类 - 一个简化的 Promise 实现
 * 遵循 Promise A+ 规范的核心功能
 */
export class HikattaPromise {
    // 状态：初始为 pending
    private status: HikattaPromiseStatus = 'pending';
    // 存储成功或失败的值
    private value: any;
    // 成功回调函数队列
    private onFulfilledCallbacks: Array<(value: any) => void> = [];
    // 失败回调函数队列
    private onRejectedCallbacks: Array<(reason: any) => void> = [];
    
    /**
     * 构造函数
     * @param executor 执行器函数，接收 resolve 和 reject 两个参数
     */
    constructor(private executor: (resolve?: (value: any) => void, reject?: (reason: any) => void) => void) {
        try {
            // 立即执行执行器函数，并绑定 resolve 和 reject 方法
            this.executor(this.resolve.bind(this), this.reject.bind(this));
        } catch (error) {
            // 如果执行器抛出错误，直接 reject
            this.reject(error);
        }
    }

    /**
     * then 方法 - 处理 Promise 的成功和失败回调
     * @param onFulfilled 成功回调函数
     * @param onRejected 失败回调函数
     * @returns 一个新的 Promise 对象，用于链式调用
     */
    then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any): HikattaPromise {
        // 返回一个新的 Promise，实现链式调用
        return new HikattaPromise((resolve, reject) => {
            // 处理成功回调
            const handleFulfilled = (value: any) => {
                try {
                    if (typeof onFulfilled === 'function') {
                        // 执行成功回调，获取返回值
                        const result = onFulfilled(value);
                        // 处理回调返回值（可能是 Promise 或其他值）
                        this.resolvePromise(result, resolve!, reject!);
                    } else {
                        // 如果没有提供成功回调，直接传递值
                        resolve!(value);
                    }
                } catch (error) {
                    // 如果回调执行出错，reject 新 Promise
                    reject!(error);
                }
            };

            // 处理失败回调
            const handleRejected = (reason: any) => {
                try {
                    if (typeof onRejected === 'function') {
                        // 执行失败回调，获取返回值
                        const result = onRejected(reason);
                        // 处理回调返回值
                        this.resolvePromise(result, resolve!, reject!);
                    } else {
                        // 如果没有提供失败回调，直接传递错误
                        reject!(reason);
                    }
                } catch (error) {
                    // 如果回调执行出错，reject 新 Promise
                    reject!(error);
                }
            };

            // 根据当前状态执行相应的回调
            if (this.status === 'fulfilled') {
                // 状态已成功，立即执行成功回调
                handleFulfilled(this.value);
            } else if (this.status === 'rejected') {
                // 状态已失败，立即执行失败回调
                handleRejected(this.value);
            } else {
                // 状态为 pending，将回调存储起来，等待状态改变时执行
                this.onFulfilledCallbacks.push(handleFulfilled);
                this.onRejectedCallbacks.push(handleRejected);
            }
        });
    }

    /**
     * resolvePromise 方法 - 处理 Promise 解析逻辑
     * 用于处理 then 方法回调函数的返回值
     * @param value 回调函数的返回值
     * @param resolve 新 Promise 的 resolve 方法
     * @param reject 新 Promise 的 reject 方法
     */
    private resolvePromise(value: any, resolve: (value: any) => void, reject: (reason: any) => void): void {
        // 防止循环引用（Promise A+ 规范）
        if (value === this) {
            return reject(new TypeError('Chaining cycle detected for promise'));
        }

        // 处理 Promise 或 PromiseLike 对象
        if (value instanceof HikattaPromise || 
            (value !== null && 
             (typeof value === 'object' || typeof value === 'function') && 
             typeof value.then === 'function')) {
            try {
                // 调用 then 方法，将 resolve 和 reject 传递进去
                value.then(resolve, reject);
            } catch (error) {
                // 如果调用 then 方法出错，reject 新 Promise
                reject(error);
            }
        } else {
            // 普通值，直接 resolve 新 Promise
            resolve(value);
        }
    }

    /**
     * resolve 方法 - 标记 Promise 为成功状态
     * @param value 成功的值
     */
    private resolve(value: any): void {
        // 使用 resolvePromise 处理值，防止值是 Promise 或 PromiseLike 对象
        this.resolvePromise(value, 
            (resolvedValue) => this.changeStatus('fulfilled', resolvedValue),
            (reason) => this.reject(reason)
        );
    }

    /**
     * reject 方法 - 标记 Promise 为失败状态
     * @param reason 失败的原因
     */
    private reject(reason: any): void {
        this.changeStatus('rejected', reason);
    }

    /**
     * changeStatus 方法 - 改变 Promise 状态并执行相应回调
     * @param status 新状态
     * @param value 成功值或失败原因
     */
    private changeStatus(status: HikattaPromiseStatus, value: any): void {
        // 状态只能从 pending 变为 fulfilled 或 rejected，不可逆转
        if (this.status !== 'pending') {
            return;
        }
        
        // 更新状态和值
        this.status = status;
        this.value = value;

        // 状态改变后，执行相应的回调函数
        if (status === 'fulfilled') {
            // 执行所有成功回调
            this.onFulfilledCallbacks.forEach(callback => callback(value));
        } else if (status === 'rejected') {
            // 执行所有失败回调
            this.onRejectedCallbacks.forEach(callback => callback(value));
        }
    }
}
