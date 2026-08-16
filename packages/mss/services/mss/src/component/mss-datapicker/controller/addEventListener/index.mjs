import { Datepicker, format, isEqual, compareAsc, isWithinInterval } from '../../views/index.mjs'
import {store, isEmpty} from '../../../../this/index.mjs'
export default async (self, actions) => {
    const input = self.shadowRoot.querySelector('.input')
    const container = self.shadowRoot.querySelector('.container')
    let datepicker = undefined
    return {
        init: () => {
            const rootNode = self.getRootNode().host
            const section = store.get('section')
            const dialog = self.dataset.dialog
            const isUpdate = dialog === 'update'
            const isRestore = dialog === 'restore'
            const dateNow = new Date(Date.now())
            const type = self.dataset.type
            const datapicker = rootNode.shadowRoot.querySelectorAll('mss-datapicker')
            const datapickerStart = rootNode.shadowRoot.querySelector('mss-datapicker[data-type="start"]')
            const datapickerEnd = rootNode.shadowRoot.querySelector('mss-datapicker[data-type="end"]')

            const welcomeSection = document.body.querySelector(`welcome-section[data-id="${section}"]`);
            // const = welcomeSection.getState('')
            let compateStartAt = ''
            let compateEndAt = ''
            let startDate = 0
            let minDate = undefined
            let maxDate = dateNow

            compateStartAt = compareAsc(new Date(self.dataset.startAt), new Date(dateNow))
            compateEndAt = compareAsc(new Date(self.dataset.endAt), new Date(dateNow))

            let selectedDates = []
            let isDatapicker = true

            if(self.dataset.endAt === "null") {
                self.dataset.endAt = 'null'
            }

            if(section.toString() === '7') {
                const subscription = welcomeSection.getState('subscription');
                minDate = subscription.startAt
                maxDate = undefined

                if(type === 'start') {
                    if(dialog === 'restore') {
                        const now = new Date(Date.now() + 90000)
                        subscription.startAt = now
                        compateEndAt = compareAsc(new Date(self.dataset.endAt), new Date(now))
                        if(compateEndAt <= 0) {
                            subscription.endAt = null
                        }

                        if(Number.isNaN(compateEndAt)) {
                            compateEndAt = -1
                        }
                    }
                }

                if(type === 'end') {
                    if(dialog === 'update' && compateStartAt <= 0) {
                        minDate = new Date(Date.now() + 90000)
                    }

                    if(dialog === 'restore' && compateEndAt <= 0) {
                        subscription.endAt = null
                    }
                }

                welcomeSection.setState('subscription', subscription)
            }

            if(section.toString() === '5') {
                minDate = undefined
                maxDate = dateNow
            }

            if(type === 'start') {
                if(dialog === 'update') {
                    if(compateStartAt <= 0) {
                        isDatapicker = false
                        datapicker.forEach(item => {
                            if(item.dataset.type === 'start') {
                                const input = item.shadowRoot.querySelector('input')
                                const dateStart = new Date(self.dataset.startAt)
                                const yyyy = dateStart.getFullYear();
                                let mm = dateStart.getMonth() + 1; // Months start at 0!
                                let dd = dateStart.getDate();
                                let h = dateStart.getHours();
                                let min = dateStart.getMinutes();
                                mm = mm < 10 ? `0${mm}`: mm
                                dd = dd < 10 ? `0${dd}`: dd
                                h = h < 10 ? `0${h}`: h
                                min = min < 10 ? `0${min}`: min

                                input.value = dd + '.' + mm + '.' + yyyy + ` ${h}:${min}`
                            }
                        })
                    } else {
                        selectedDates = []
                        minDate = new Date(Date.now() + 90000)
                        selectedDates.push(new Date(self.dataset.startAt))
                    }
                }

                if(dialog === 'restore') {
                    if(compateStartAt <= 0) {
                        selectedDates = []
                        minDate = new Date(Date.now() + 90000)
                        selectedDates.push(minDate)
                    } else {
                        selectedDates = []
                        selectedDates.push(new Date(self.dataset.startAt))
                    }
                }
            }

            if(type === 'end') {
                if(dialog === 'update') {
                    if(isEmpty(self.dataset.endAt) || self.dataset.endAt === '0' || self.dataset.endAt === '-') {
                        selectedDates = []
                    } else {
                        const now = new Date(Date.now() + 90000)
                        compateEndAt = compareAsc(new Date(self.dataset.endAt), new Date(now))

                        if(compateEndAt <= 0 || Number.isNaN(compateEndAt)) {
                            const subscription = welcomeSection.getState('subscription');
                            subscription.endAt = null
                            welcomeSection.setState('subscription', subscription)
                        } else {
                            selectedDates = []

                            if(compateStartAt <= 0) {
                                minDate = new Date(new Date(Date.now() + 90000))
                            } else {
                                minDate = new Date(new Date(self.dataset.startAt).valueOf() + 90000)
                            }

                            selectedDates.push(new Date(self.dataset.endAt))
                        }
                    }
                }

                if(dialog === 'restore' || dialog === 'audit') {
                    if(compateEndAt <= 0) {
                        selectedDates = []
                    } else {
                        if(dialog !== 'audit') {
                            minDate = new Date(Date.now() + 90000)
                        }
                        selectedDates = []
                        selectedDates.push(new Date(self.dataset.endAt))
                    }
                }
            }

            let props = {
                buttons: [ 'clear'],
                timepicker: true,
                inline: false,
                isMobile: false,
                autoClose: true,
                range: false,
                selectOtherMonths: false,
                minDate: minDate,
                maxDate: maxDate,
                startDate: startDate,
                multipleDatesSeparator: ' - ',
                selectedDates: selectedDates,
                container: container,
                onSelect: actions.onSelect,
                onChangeViewDate: actions.onChangeViewDate,
                onChangeView: actions.onChangeView,
                onShow: actions.onShow,
                onHide: actions.onHide,
                onClickDayName: actions.onClickDayName,
                onBeforeSelect: actions.onBeforeSelect,
                onFocus: actions.onFocus,
                onRenderCell: actions.onRenderCell
            }

            if(type === 'start') {
               delete props.buttons
                if(compateEndAt > 0) {
                    props.maxDate = new Date(new Date(self.dataset.endAt).valueOf() - 90000)
                    props.minDate = new Date(new Date(Date.now() + 90000))
                }
                // props.position = 'left center'
            }

            if(type === 'end') {
                if(compateStartAt > 0) {
                    props.minDate = new Date(self.dataset.startAt)
                    props.maxDate = undefined
                }

                // props.position = 'right center'
            }

            if(isDatapicker) {
                datepicker = new Datepicker(input, props)
                self.datepicker = datepicker
            }
        },
        terminate: () => {
            // if(datepicker.hasOwnProperty('destroy')) {
            //     datepicker.destroy();
            // }
        }
    }
}