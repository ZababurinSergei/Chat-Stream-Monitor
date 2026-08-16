import { isEmpty } from '../../../this/index.mjs';
import {compareAsc, isEqual, isWithinInterval} from "../views/index.mjs";

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        const rootNode = self.getRootNode().host
        const datapickerStart = rootNode.shadowRoot.querySelector('mss-datapicker[data-type="start"]')
        const datapickerEnd = rootNode.shadowRoot.querySelector('mss-datapicker[data-type="end"]')

        const disabledDate = new Date('2023-07-13T00:00:00');
        const isDisabledDateIsInRange = ({date, datepicker}) => {
            const selectedDate = datepicker.selectedDates[0];
            if (selectedDate && datepicker.selectedDates.length === 1) {
                const sortedDates = [selectedDate, date].toSorted((a, b) => {
                    if (a.getTime() > b.getTime()) {
                        return 1;
                    }
                    return -1;
                })

                return (isWithinInterval(disabledDate, {
                    start: sortedDates[0],
                    end: sortedDates[1]
                }))
            }
        }

        resolve({
            onShow: async (isShow)  => {
            },
            onBeforeSelect: ({date, datepicker}) => {
                return isDisabledDateIsInRange({date, datepicker}) ? true: !isDisabledDateIsInRange({date, datepicker});
            },
            onFocus: ({date, datepicker}) => {
                if (isDisabledDateIsInRange({date, datepicker}) || isEqual(date, disabledDate)) {
                    datepicker.$datepicker.classList.add('-disabled-range-')
                } else {
                    datepicker.$datepicker.classList.remove('-disabled-range-')
                }
            },
            onRenderCell: ({date}) => { },
            onClickDayName: async (...args)  => { },
            onHide: async (...args)  => {

            },
            onChangeView: async (...args)  => { },
            onChangeViewDate: async (...args)  => { },
            onSelect: async (event) => {
                const ferDialog = self.getRootNode().host

                if(ferDialog.dataset.id === '5') {
                    if(self.dataset.type === 'end') {
                        if(self.dataset.dialog === 'update') {
                            datapickerStart.update = {
                                maxDate: new Date(event.date)
                            }
                        }

                        if(self.dataset.dialog === 'restore' || self.dataset.dialog === 'audit') {
                            let timeStamp = new Date(event.date).valueOf() - 90000
                            datapickerStart.update = {
                                maxDate: new Date(timeStamp)
                            }
                        }
                    }

                    if(self.dataset.type === 'start') {
                        if(self.dataset.dialog === 'update') {
                            datapickerEnd.update = {
                                minDate: new Date(event.date)
                            }
                        }

                        if(self.dataset.dialog === 'restore') {
                            let timeStamp = new Date(event.date).valueOf() + 90000
                            datapickerEnd.update = {
                                minDate: new Date(timeStamp)
                            }
                        }
                    }

                    const service = document.querySelector('.service')
                    const mssFilter = document.querySelector('mss-filter');
                    const welcomeSection = service.querySelector(`welcome-section[data-id="${ferDialog.dataset.id}"]`);
                    const datapicker = ferDialog.shadowRoot.querySelector('.container.datapicker')
                    const error = datapicker.querySelector('.error')
                    let subscription = welcomeSection.getState('subscription')

                    if(error !== null) {
                        error.remove()
                    }

                    let filter = mssFilter.getState('filter')

                    if(self.dataset.type === 'start') {
                        filter.startDate = event.date ? new Date(event.date).toISOString() : null
                    }

                    if(self.dataset.type === 'end') {
                        filter.endDate = event.date ? new Date(event.date).toISOString(): null
                    }


                    mssFilter.setState('filter', filter)
                }

                const service = document.querySelector('.service')
                let welcomeSection = service.querySelector(`welcome-section[data-id="${ferDialog.dataset.id}"]`);

                if(ferDialog.dataset.id === '7') {
                    if(self.dataset.type === 'end') {
                        if(self.dataset.dialog === 'update') {
                            datapickerStart.update = {
                                maxDate: new Date(event.date)
                            }
                        }

                        if(self.dataset.dialog === 'restore') {
                            datapickerStart.update = {
                                maxDate: new Date(event.date)
                            }
                        }
                    }

                    if(self.dataset.type === 'start') {
                        if(self.dataset.dialog === 'update') {
                            datapickerEnd.update = {
                                minDate: new Date(event.date)
                            }
                        }

                        if(self.dataset.dialog === 'restore') {
                            datapickerEnd.update = {
                                minDate: new Date(event.date)
                            }
                        }
                    }

                    const datapicker = ferDialog.shadowRoot.querySelector('.container.datapicker')
                    const error = datapicker.querySelector('.error')
                    let subscription = welcomeSection.getState('subscription')

                    if(error !== null) {
                        error.remove()
                    }

                    if(self.dataset.type === 'start') {
                        subscription.startAt = event.date ? new Date(event.date).toISOString() : null
                    }

                    if(self.dataset.type === 'end') {
                        subscription.endAt = event.date ? new Date(event.date).toISOString(): null
                    }

                    welcomeSection.setState('subscription', subscription)
                }

                if(ferDialog.dataset.id === '7-update' || ferDialog.dataset.id === '7-restore') {
                    let welcomeSection = document.querySelector(`welcome-section[data-id="7"]`);
                    let subscription = welcomeSection.getState('subscription')

                    if(isEmpty(event.date) && self.dataset.type === 'end') {
                        subscription.endAt = null
                        welcomeSection.setState('subscription', subscription);
                    }

                    if(self.dataset.type === 'end') {
                        if(self.dataset.dialog === 'update') {
                            const compateStartAt = compareAsc(new Date(subscription.startAt), new Date(Date.now() + 90000))

                            const now = new Date(new Date(Date.now() + 90000))
                            if(compateStartAt <= 0) {
                                datapickerEnd.update = {
                                    minDate: new Date(now)
                                }
                            } else {
                                datapickerEnd.update = {
                                    minDate: new Date(new Date(subscription.startAt).valueOf() + 90000)
                                }
                            }

                        }

                        if(self.dataset.dialog === 'restore') {
                            datapickerStart.update = {
                                maxDate: new Date(new Date(event.date).valueOf() - 90000)
                            }
                        }
                    }

                    if(self.dataset.type === 'start') {
                        if(self.dataset.dialog === 'update') {
                            datapickerEnd.update = {
                                minDate: new Date(new Date(event.date).valueOf() + 90000 )
                            }
                        }

                        if(self.dataset.dialog === 'restore') {
                            if(!isEmpty(subscription.endAt)) {
                                datapickerStart.update = {
                                    maxDate: new Date(new Date(subscription.endAt).valueOf() - 90000)
                                }
                            }


                            datapickerEnd.update = {
                                minDate: new Date(new Date(event.date).valueOf() + 90000)
                            }
                        }
                    }


                    const service = document.querySelector('.service')
                    welcomeSection = service.querySelector(`welcome-section[data-id="7"]`);
                    const error = ferDialog.shadowRoot.querySelector('.error')

                    if(error !== null) {
                        error.remove()
                    }

                    if(self.dataset.type === 'start') {
                        subscription.startAt = event.date ? new Date(event.date).toISOString() : null
                    }

                    if(self.dataset.type === 'end') {
                        subscription.endAt = event.date ? new Date(event.date).toISOString(): null
                    }


                    welcomeSection.setState('subscription', subscription)
                }
            }
        })
    })
}

export default {
    description: 'action'
}