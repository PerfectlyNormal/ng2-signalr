
import { ConnectionTransports } from './connection/connection.transports';
import { ConnectionTransport } from './connection/connection.transport';
import { IConnectionOptions } from './connection/connection.options';
import { LogLevel, IHttpConnectionOptions } from '@aspnet/signalr';

export class SignalRConfiguration implements IConnectionOptions {

  /** connection url to the SignalR service */
  public url: string;

  /** Allows you to specify query string parameters object when the client connects */
  public qs?: any;

  /** name of the SignalR service hub to connect to */
  public hubName: string;

  /** Level of details for logging. Defaults to Error */
  public logging: LogLevel;

  /** Allows jsonp. This flag can be used to suppport CORS on older browsers */
  public jsonp: boolean;

  /** Allows withCredentials. This flag can be used to suppport CORS */
  public withCredentials: boolean;

  /** Allows pingInterval */
  public pingInterval?: number;

  /** Allows you to specify transport. You can specify a fallback order if you wan't to try specific transports in order. By default selects best avaliable transport. */
  public transport: ConnectionTransport | ConnectionTransport[];

  /** Allows you to run the event callback outside ngZone */
  public executeEventsInZone?: boolean;

  /** Allows you to run the errors callback outside ngZone */
  public executeErrorsInZone?: boolean;

  /** Allows you to run the status change in callback outside ngZone */
  public executeStatusChangeInZone?: boolean;

  /** Allows you to pass extra options to the connection builder, for example passing in an accessTokenFactory */
  public httpConnectionOptions?: IHttpConnectionOptions;

  constructor() {
    this.hubName = null;
    this.logging = LogLevel.Error;
    this.qs = null;
    this.url = null;
    this.jsonp = false;
    this.withCredentials = false;
    this.transport = ConnectionTransports.auto;
    this.executeEventsInZone = true;
    this.executeErrorsInZone = false;
    this.executeStatusChangeInZone = true;
    this.pingInterval = 300000;
    this.httpConnectionOptions = null;
  }
}
