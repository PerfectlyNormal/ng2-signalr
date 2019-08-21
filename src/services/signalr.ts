import { NgZone, Injectable } from '@angular/core';
import { HubConnectionBuilder } from '@aspnet/signalr';

import { ISignalRConnection } from './connection/i.signalr.connection';
import { SignalRConfiguration } from './signalr.configuration';
import { SignalRConnection } from './connection/signalr.connection';
import { IConnectionOptions } from './connection/connection.options';

@Injectable()
export class SignalR {
    private _configuration: SignalRConfiguration;
    private _zone: NgZone;

    public constructor(
        configuration: SignalRConfiguration,
        zone: NgZone
    ) {
        this._configuration = configuration;
        this._zone = zone;
    }

    public createConnection(options?: IConnectionOptions): SignalRConnection {
        const configuration = this.merge(options ? options : {});

        this.logConfiguration(configuration);

        // create connection object
        const jConnection = new HubConnectionBuilder()
            .withUrl(configuration.url, configuration.httpConnectionOptions)
            .configureLogging(configuration.logging)
            .build();
        // FIXME: jConnection.qs = configuration.qs;

        // !!! important. We need to register at least one function otherwise server callbacks will not work.
        jConnection.on('noOp', () => { /* */ });

        return new SignalRConnection(jConnection, this._zone, configuration);
    }

    public connect(options?: IConnectionOptions): Promise<ISignalRConnection> {
        return this.createConnection(options).start();
    }

    private logConfiguration(configuration: SignalRConfiguration) {
        try {
            const serializedQs = JSON.stringify(configuration.qs);
            const serializedTransport = JSON.stringify(configuration.transport);
            if (configuration.logging) {
                console.log(`Creating connecting with...`);
                console.log(`configuration:[url: '${configuration.url}'] ...`);
                console.log(`configuration:[hubName: '${configuration.hubName}'] ...`);
                console.log(`configuration:[qs: '${serializedQs}'] ...`);
                console.log(`configuration:[transport: '${serializedTransport}'] ...`);
            }
        } catch (err) { /* */ }
    }

    private merge(overrides: IConnectionOptions): SignalRConfiguration {
        const merged: SignalRConfiguration = new SignalRConfiguration();
        merged.hubName = overrides.hubName || this._configuration.hubName;
        merged.url = overrides.url || this._configuration.url;
        merged.httpConnectionOptions = overrides.httpConnectionOptions || this._configuration.httpConnectionOptions;
        merged.qs = overrides.qs || this._configuration.qs;
        merged.logging = this._configuration.logging;
        merged.jsonp = overrides.jsonp || this._configuration.jsonp;
        merged.withCredentials = overrides.withCredentials || this._configuration.withCredentials;
        merged.transport = overrides.transport || this._configuration.transport;
        merged.executeEventsInZone = overrides.executeEventsInZone || this._configuration.executeEventsInZone;
        merged.executeErrorsInZone = overrides.executeErrorsInZone || this._configuration.executeErrorsInZone;
        merged.executeStatusChangeInZone = overrides.executeStatusChangeInZone || this._configuration.executeStatusChangeInZone;
        merged.pingInterval = overrides.pingInterval || this._configuration.pingInterval;
        return merged;
    }

}
