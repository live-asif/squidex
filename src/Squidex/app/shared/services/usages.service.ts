/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
    ApiUrlConfig,
    DateTime,
    HTTP,
    pretifyError
} from '@app/framework';

export class CallsUsageDto {
    constructor(
        public readonly date: DateTime,
        public readonly count: number,
        public readonly averageMs: number
    ) {
    }
}

export class StorageUsageDto {
    constructor(
        public readonly date: DateTime,
        public readonly count: number,
        public readonly size: number
    ) {
    }
}

export class CurrentStorageDto {
    constructor(
        public readonly size: number,
        public readonly maxAllowed: number
    ) {
    }
}

export class CurrentCallsDto {
    constructor(
        public readonly count: number,
        public readonly maxAllowed: number
    ) {
    }
}

@Injectable()
export class UsagesService {
    constructor(
        private readonly http: HttpClient,
        private readonly apiUrl: ApiUrlConfig
    ) {
    }

    public getLog(app: string): Observable<string> {
        const url = this.apiUrl.buildUrl(`api/apps/${app}/usages/log`);

        return this.http.get<any>(url).pipe(
            map(response => {
                return response.downloadUrl;
            }),
            pretifyError('Failed to load monthly api calls. Please reload.'));
    }

    public getMonthCalls(app: string): Observable<CurrentCallsDto> {
        const url = this.apiUrl.buildUrl(`api/apps/${app}/usages/calls/month`);

        return HTTP.getVersioned<any>(this.http, url).pipe(
                map(response => {
                    const body = response.payload.body;

                    return new CurrentCallsDto(body.count, body.maxAllowed);
                }),
                pretifyError('Failed to load monthly api calls. Please reload.'));
    }

    public getTodayStorage(app: string): Observable<CurrentStorageDto> {
        const url = this.apiUrl.buildUrl(`api/apps/${app}/usages/storage/today`);

        return HTTP.getVersioned<any>(this.http, url).pipe(
                map(response => {
                    const body = response.payload.body;

                    return new CurrentStorageDto(body.size, body.maxAllowed);
                }),
                pretifyError('Failed to load todays storage size. Please reload.'));
    }

    public getCallsUsages(app: string, fromDate: DateTime, toDate: DateTime): Observable<{ [category: string]: CallsUsageDto[] }> {
        const url = this.apiUrl.buildUrl(`api/apps/${app}/usages/calls/${fromDate.toUTCStringFormat('YYYY-MM-DD')}/${toDate.toUTCStringFormat('YYYY-MM-DD')}`);

        return HTTP.getVersioned<any>(this.http, url).pipe(
                map(response => {
                    const body = response.payload.body;

                    const result: { [category: string]: CallsUsageDto[] } = {};

                    for (let category of Object.keys(body)) {
                        result[category] = body[category].map((item: any) => {
                            return new CallsUsageDto(
                                DateTime.parseISO_UTC(item.date),
                                item.count,
                                item.averageMs);
                        });
                    }
                    return result;
                }),
                pretifyError('Failed to load calls usage. Please reload.'));
    }

    public getStorageUsages(app: string, fromDate: DateTime, toDate: DateTime): Observable<StorageUsageDto[]> {
        const url = this.apiUrl.buildUrl(`api/apps/${app}/usages/storage/${fromDate.toUTCStringFormat('YYYY-MM-DD')}/${toDate.toUTCStringFormat('YYYY-MM-DD')}`);

        return HTTP.getVersioned<any>(this.http, url).pipe(
                map(response => {
                    const body = response.payload.body;

                    const items: any[] = body;

                    return items.map(item => {
                        return new StorageUsageDto(
                            DateTime.parseISO_UTC(item.date),
                            item.count,
                            item.size);
                    });
                }),
                pretifyError('Failed to load storage usage. Please reload.'));
    }
}