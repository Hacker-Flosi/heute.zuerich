declare module 'eventfrog-api' {
  export class EventfrogService {
    constructor(apiKey: string)
    loadEvents(request: EventfrogEventRequest): Promise<EventfrogEvent[]>
  }

  export class EventfrogEventRequest {
    constructor(options?: Record<string, unknown>)
  }

  export interface EventfrogEvent {
    id: string
    title: string | null
    startDate: Date
    endDate: Date
    link: string | null
    location: EventfrogLocation | null
    group: EventfrogGroup | null
  }

  export interface EventfrogLocation {
    id: string
    title: string | null
    city: string
    address: string
  }

  export interface EventfrogGroup {
    id: string
    title: string | null
  }
}
