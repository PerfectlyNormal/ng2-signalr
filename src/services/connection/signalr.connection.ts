import { ISignalRConnection } from './i.signalr.connection';
import { Observable, Subject } from 'rxjs';
import { BroadcastEventListener } from '../eventing/broadcast.event.listener';
import { ConnectionStatus } from './connection.status';
import { NgZone } from '@angular/core';
import { SignalRConfiguration } from '../signalr.configuration';
import { ConnectionTransport } from './connection.transport';
import { HubConnection, LogLevel } from '@aspnet/signalr';
import { ConnectionStatuses } from './connection.statuses';

export declare type CallbackFn = (...args: any[]) => void;

export class SignalRConnection implements ISignalRConnection {
    private _status: Subject<ConnectionStatus>;
    private _errors: Subject<any>;
    private _jConnection: HubConnection;
    private _zone: NgZone;
    private _configuration: SignalRConfiguration;
    private _listeners: { [eventName: string]: CallbackFn[] };

    constructor(jConnection: HubConnection, zone: NgZone, configuration: SignalRConfiguration) {
        this._jConnection = jConnection;
        this._zone = zone;
        this._errors = new Subject<any>();
        this._status = this.wireUpStatusEventsAsObservable();
        this._configuration = configuration;
        this._listeners = {};
    }

    public get errors(): Observable<any> {
        return this._errors;
    }

    public get status(): Observable<ConnectionStatus> {
        return this._status;
    }

    public start(): Promise<ISignalRConnection> {
        this._status.next(ConnectionStatuses.connecting);

        const $promise = new Promise<ISignalRConnection>((resolve, reject) => {
            this._jConnection
                .start()
                .then(() => {
                    this._status.next(ConnectionStatuses.connected);
                    resolve(this);
                })
                .catch((error: any) => {
                    this._status.next(ConnectionStatuses.disconnected);
                    this.run(() => this._errors.next(error), this._configuration.executeErrorsInZone);
                    reject('Failed to connect. Error: ' + error.message); // ex: Error during negotiation request.
                });
        });

        return $promise;
    }

    public stop(): void {
        this._status.next(ConnectionStatuses.disconnected);
        this._jConnection.stop();
    }

    public invoke(method: string, ...parameters: any[]): Promise<any> {
        if (method == null) {
            throw new Error('SignalRConnection: Failed to invoke. Argument \'method\' can not be null');
        }
        this.log(`SignalRConnection. Start invoking \'${method}\'...`);

        const $promise = new Promise<any>((resolve, reject) => {
            this._jConnection.invoke(method, ...parameters)
                .then((result: any) => {
                    this.log(`\'${method}\' invoked succesfully. Resolving promise...`);
                    resolve(result);
                    this.log(`Promise resolved.`);
                })
                .catch((err: any) => {
                    console.log(`Invoking \'${method}\' failed. Rejecting promise...`);
                    reject(err);
                    console.log(`Promise rejected.`);
                });
        });
        return $promise;
    }

    public listen<T>(listener: BroadcastEventListener<T>): void {
        if (listener == null) {
            throw new Error('Failed to listen. Argument \'listener\' can not be null');
        }

        const callback: CallbackFn = (...args: any[]) => {
            this.run(() => {
                let casted: T = null;
                if (args.length > 0) {
                    casted = args[0] as T;
                }
                this.log('SignalRConnection.proxy.on invoked. Calling listener next() ...');
                listener.next(casted);
                this.log('listener next() called.');
            }, this._configuration.executeEventsInZone);
        };

        this.setListener(callback, listener);
    }

    public stopListening<T>(listener: BroadcastEventListener<T>): void {
        if (listener == null) {
            throw new Error('Failed to listen. Argument \'listener\' can not be null');
        }

        this.log(`SignalRConnection: Stopping listening to server event with name ${listener.event}`);
        if (!this._listeners[listener.event]) {
            this._listeners[listener.event] = [];
        }

        for (const callback of this._listeners[listener.event]) {
            this._jConnection.off(listener.event, callback);
        }

        this._listeners[listener.event] = [];
    }

    public listenFor<T>(event: string): BroadcastEventListener<T> {
        if (event == null || event === '') {
            throw new Error('Failed to listen. Argument \'event\' can not be empty');
        }

        const listener = new BroadcastEventListener<T>(event);

        this.listen(listener);

        return listener;
    }

    public listenForRaw(event: string): BroadcastEventListener<any[]> {
        if (event == null || event === '') {
            throw new Error('Failed to listen. Argument \'event\' can not be empty');
        }

        const listener = new BroadcastEventListener<any[]>(event);

        const callback: CallbackFn = (...args: any[]) => {
            this.run(() => {
                let casted: any[] = [];
                if (args.length > 0) {
                    casted = args;
                }
                this.log('SignalRConnection.proxy.on invoked. Calling listener next() ...');
                listener.next(args);
                this.log('listener next() called.');
            }, this._configuration.executeEventsInZone);
        };

        this.setListener(callback, listener);
        return listener;
    }

    private setListener<T>(callback: CallbackFn, listener: BroadcastEventListener<T>) {
        this.log(`SignalRConnection: Starting to listen to server event with name ${listener.event}`);
        this._jConnection.on(listener.event, callback);

        if (this._listeners[listener.event] == null) {
            this._listeners[listener.event] = [];
        }

        this._listeners[listener.event].push(callback);
    }

    private convertTransports(transports: ConnectionTransport | ConnectionTransport[]): any {
        if (transports instanceof Array) {
            return transports.map((t: ConnectionTransport) => t.name);
        }
        return transports.name;
    }

    private wireUpStatusEventsAsObservable(): Subject<ConnectionStatus> {
        const sStatus = new Subject<ConnectionStatus>();

        // aggregate all signalr connection status handlers into 1 observable.
        // handler wire up, for signalr connection status callback.
        this._jConnection.onclose((change: any) => {
            this.run(() => {
                let connectionStatus: ConnectionStatus = null;

                if (change && change.hasOwnProperty('newState'))
                    connectionStatus = new ConnectionStatus(change.newState);
                else if (!change || change.hasOwnProperty('message')) // Probably an error
                    connectionStatus = ConnectionStatuses.disconnected;

                sStatus.next(connectionStatus);
            }, this._configuration.executeStatusChangeInZone);
        });

        return sStatus;
    }

    private onBroadcastEventReceived<T>(listener: BroadcastEventListener<T>, ...args: any[]) {
        this.log('SignalRConnection.proxy.on invoked. Calling listener next() ...');

        let casted: T = null;
        if (args.length > 0) {
            casted = args[0] as T;
        }

        this.run(() => {
            listener.next(casted);
        }, this._configuration.executeEventsInZone);

        this.log('listener next() called.');
    }

    private log(...args: any[]) {
        if (this._configuration.logging === LogLevel.None) {
            return;
        }
        console.log(args.join(', '));
    }

    private run(func: () => void, inZone: boolean) {
        if (inZone) {
            this._zone.run(() => func());
        } else {
            this._zone.runOutsideAngular(() => func());
        }
    }
}
