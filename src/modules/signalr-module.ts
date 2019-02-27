import { NgModule, ModuleWithProviders, NgZone, InjectionToken } from '@angular/core';
import { HubConnectionBuilder } from '@aspnet/signalr';
import { SignalR } from '../services/signalr';
import { SignalRConfiguration } from '../services/signalr.configuration';

const SIGNALR_CONFIGURATION = new InjectionToken<SignalRConfiguration>('SIGNALR_CONFIGURATION');

export function createSignalr(configuration: SignalRConfiguration, zone: NgZone) {
    return new SignalR(configuration, zone);
}

@NgModule({
    providers: [{
        provide: SignalR,
        useValue: SignalR
    }]
})
export class SignalRModule {
    public static forRoot(getSignalRConfiguration: () => void): ModuleWithProviders {
        return {
            ngModule: SignalRModule,
            providers: [
                {
                    provide: SIGNALR_CONFIGURATION,
                    useFactory: getSignalRConfiguration
                },
                {
                    deps: [SIGNALR_CONFIGURATION, NgZone],
                    provide: SignalR,
                    useFactory: (createSignalr)
                }
            ],
        };
    }
    public static forChild(): ModuleWithProviders {
        throw new Error("forChild method not implemented");
    }
}
