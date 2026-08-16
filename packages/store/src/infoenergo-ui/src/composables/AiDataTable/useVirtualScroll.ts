import { ref, computed, nextTick } from 'vue';
import type { Ref } from 'vue';
import type { NDataTable } from 'naive-ui';
import type { VirtualScrollTools } from '@/interfaces/common.ts';

const WINDOW_PAGES = 3;
const SCROLL_ROWS_PER_TICK = 3.43;
const MIN_THUMB_HEIGHT_PX = 40;

export const useVirtualScroll = () => {
    const totalCount = ref(0);
    const pageSize = ref(0);
    const minRowHeight = ref(0);
    const scrollbarContainerHeight = ref(0);
    const thumbScrollTop = ref(0);
    const dataScrollTop = ref(0);
    const globalPosition = ref(0);
    const currentPage = ref(1);
    const dataContainer = ref<HTMLElement | null>(null);
    const scrollbarContainer = ref<HTMLElement | null>(null);
    const scrollbarTrack = ref<HTMLElement>(document.createElement('div'));
    const scrollbarThumb = ref<HTMLElement>(document.createElement('div'));

    const abortController = new AbortController();
    const { signal } = abortController;
    let tableRoot: HTMLElement | undefined;
    let virtualScrollTools: VirtualScrollTools | undefined;
    let dataContainerObserver: ResizeObserver | undefined;

    const pagesCount = computed(() => Math.ceil(totalCount.value / pageSize.value));
    const minPageHeight = computed(() => pageSize.value * minRowHeight.value);
    const dataMathContainerHeight = computed(() => totalCount.value * minRowHeight.value);
    const scrollStep = computed(() => SCROLL_ROWS_PER_TICK * minRowHeight.value);
    const topVirtualBorder = computed(() => pageSize.value * minRowHeight.value);
    const bottomVirtualBorder = computed(() => 2 * pageSize.value * minRowHeight.value);
    const dataRealContainerHeight = computed(() => WINDOW_PAGES * pageSize.value * minRowHeight.value);
    const thumbHeightPx = computed(() =>
        Math.max(MIN_THUMB_HEIGHT_PX, scrollbarContainerHeight.value ** 2 / dataMathContainerHeight.value)
    );
    const maxMathScroll = computed(() => dataMathContainerHeight.value - scrollbarContainerHeight.value);
    const maxRealScroll = computed(() => dataRealContainerHeight.value - scrollbarContainerHeight.value);
    const maxThumb = computed(() => scrollbarContainerHeight.value - thumbHeightPx.value);

    const isFirstPage = computed(() => currentPage.value === 1);
    const isSecondPage = computed(() => currentPage.value === 2);
    const isLastPage = computed(() => currentPage.value === pagesCount.value);
    const nextPage = computed(() => currentPage.value + 1);
    const prevPage = computed(() => currentPage.value - 1);

    const initState = async (
        dataTableRef: Ref<InstanceType<typeof NDataTable> | null>,
        incomingPageSize: number,
        incomingCellHeight: number,
        getVirtualScrollTools: (incomingPageSize: number) => VirtualScrollTools
    ) => {
        if (!dataTableRef.value) return;
        virtualScrollTools = getVirtualScrollTools(incomingPageSize);
        if (!virtualScrollTools) throw new Error('Virtual scroll tools not found');

        pageSize.value = incomingPageSize;
        minRowHeight.value = incomingCellHeight;

        const response = await virtualScrollTools.getData(0, 2 * pageSize.value, true);
        if (!response.result) return false;
        totalCount.value = response.totalCount;

        await nextTick();

        tableRoot = dataTableRef.value?.$el as HTMLElement | undefined;

        if (!tableRoot) throw new Error('Table root not found');
    };

    const removeScrollbarRail = () => {
        if (!tableRoot) throw new Error('Table root not found');
        const scrollbarRail = tableRoot.querySelector('.n-scrollbar-rail');
        if (!scrollbarRail) throw new Error('Scrollbar rail not found');
        scrollbarRail.remove();
    };

    const initScrollbarContainer = () => {
        if (!tableRoot) throw new Error('Table root not found');
        scrollbarContainer.value = tableRoot.querySelector('.n-scrollbar-container');
        if (!scrollbarContainer.value) return null;

        scrollbarContainerHeight.value = scrollbarContainer.value.clientHeight;
        scrollbarContainer.value.classList.add('ai-scrollbar-container');
        scrollbarContainer.value.style.height = '100%';
    };

    const initDataContainer = () => {
        if (!tableRoot) throw new Error('Table root not found');
        dataContainer.value = tableRoot.querySelector('.n-data-table-tbody');
        if (dataContainer.value === null) return null;
    };

    const createScrollbarTrack = () => {
        scrollbarTrack.value.classList.add('ai-scrollbar-track');
        if (!scrollbarContainer.value) throw new Error('Scrollbar container not found');
        scrollbarContainer.value.appendChild(scrollbarTrack.value);
    };

    const createScrollbarThumb = () => {
        scrollbarThumb.value.classList.add('ai-scrollbar-thumb');
        Object.assign(scrollbarThumb.value.style, {
            height: `${thumbHeightPx.value}px`,
        });
        if (!scrollbarContainer.value) throw new Error('Scrollbar container not found');
        scrollbarTrack.value.appendChild(scrollbarThumb.value);
    };

    const createScrollbar = async () => {
        const clampGlobalPosition = (value: number) => Math.min(maxMathScroll.value, Math.max(0, value));
        const clampThumb = (value: number) => Math.min(maxThumb.value, Math.max(0, value));
        const clampData = (value: number) => Math.min(maxRealScroll.value, Math.max(0, value));
        const calcCurrentPage = () =>
            Math.min(pagesCount.value, Math.max(1, Math.floor(globalPosition.value / minPageHeight.value) + 1));

        const isScrollBlocked = (direction: number) =>
            (globalPosition.value >= maxMathScroll.value && direction === 1) ||
            (globalPosition.value <= 0 && direction === -1);

        const updateGlobalPosition = (direction: number) => {
            globalPosition.value = clampGlobalPosition(globalPosition.value + direction * scrollStep.value);
        };

        const updateDataScrollTop = () => {
            const pageStart = (currentPage.value - 1) * minPageHeight.value;
            const offsetInPage = globalPosition.value - pageStart;

            if (isFirstPage.value) {
                dataScrollTop.value = clampData(offsetInPage);
            } else if (isLastPage.value) {
                dataScrollTop.value = clampData(2 * minPageHeight.value + offsetInPage);
            } else {
                dataScrollTop.value = clampData(minPageHeight.value + offsetInPage);
            }
        };

        const updateThumb = () => {
            thumbScrollTop.value = clampThumb(maxThumb.value * (globalPosition.value / maxMathScroll.value));
            scrollbarThumb.value.style.transform = `translateY(${thumbScrollTop.value}px)`;
        };

        const updateDataTransform = () => {
            if (!dataContainer.value) throw new Error('Data container not found');
            dataContainer.value.style.transform = `translateY(${-dataScrollTop.value}px)`;
        };

        const loadNextPageInWindow = async () => {
            ++currentPage.value;

            if (isSecondPage.value) {
                const response = await virtualScrollTools?.getData(
                    pageSize.value * (nextPage.value - 1),
                    pageSize.value,
                    true
                );
                if (!response?.result) return;
                totalCount.value = response.totalCount;
                updateDataScrollTop();
            } else if (!isLastPage.value) {
                const response = await virtualScrollTools?.getData(
                    pageSize.value * (nextPage.value - 1),
                    pageSize.value,
                    true
                );
                if (!response?.result) return;
                totalCount.value = response.totalCount;
                virtualScrollTools?.removeDataFromTop(pageSize.value);
                updateDataScrollTop();
            } else {
                updateDataScrollTop();
            }
        };

        const loadPrevPageInWindow = async () => {
            --currentPage.value;

            if (!isFirstPage.value) {
                const response = await virtualScrollTools?.getData(
                    pageSize.value * (prevPage.value - 1),
                    pageSize.value,
                    false
                );
                if (!response?.result) return;
                totalCount.value = response.totalCount;
            }

            virtualScrollTools?.removeDataFromBottom(pageSize.value);
            updateDataScrollTop();
        };

        const applyScroll = async (direction: number) => {
            if (virtualScrollTools?.isPageLoading.value || isScrollBlocked(direction)) return;

            updateGlobalPosition(direction);

            if (direction === 1) {
                if (
                    (dataScrollTop.value > bottomVirtualBorder.value && !isLastPage.value) ||
                    (dataScrollTop.value > topVirtualBorder.value && isFirstPage.value)
                ) {
                    await loadNextPageInWindow();
                } else {
                    updateDataScrollTop();
                }
            } else {
                if (dataScrollTop.value <= topVirtualBorder.value && !isFirstPage.value && !isLastPage.value) {
                    await loadPrevPageInWindow();
                } else if (dataScrollTop.value <= topVirtualBorder.value && isLastPage.value) {
                    --currentPage.value;
                    updateDataScrollTop();
                } else {
                    updateDataScrollTop();
                }
            }

            updateThumb();
            updateDataTransform();
        };

        const onWheel = async (event: WheelEvent) => {
            if (virtualScrollTools?.isPageLoading.value) return;
            event.preventDefault();
            const direction = Math.sign(event.deltaY);
            if (direction === 0) return;
            await applyScroll(direction);
        };

        const onThumbPointerDown = (event: PointerEvent) => {
            if (virtualScrollTools?.isPageLoading.value) return;
            event.preventDefault();

            const thumb = scrollbarThumb.value;
            const track = scrollbarTrack.value;
            const trackRect = track.getBoundingClientRect();
            const pointerOffsetInThumb = event.clientY - trackRect.top - thumbScrollTop.value;

            thumb.setPointerCapture(event.pointerId);

            const globalFromThumbTop = (thumbTop: number) =>
                clampGlobalPosition((thumbTop / maxThumb.value) * maxMathScroll.value);

            const applyFromClientY = (clientY: number) => {
                const rect = track.getBoundingClientRect();
                const nextThumbTop = clampThumb(clientY - rect.top - pointerOffsetInThumb);

                globalPosition.value = globalFromThumbTop(nextThumbTop);
                updateThumb();
            };

            const onPointerMove = (e: PointerEvent) => {
                applyFromClientY(e.clientY);
            };

            const onPointerUp = async (e: PointerEvent) => {
                thumb.releasePointerCapture(e.pointerId);
                thumb.removeEventListener('pointermove', onPointerMove);
                thumb.removeEventListener('pointerup', onPointerUp);
                thumb.removeEventListener('pointercancel', onPointerUp);
                applyFromClientY(e.clientY);

                currentPage.value = calcCurrentPage();
                await refreshData();

                await nextTick();
                updateDataScrollTop();
                updateDataTransform();
            };

            thumb.addEventListener('pointermove', onPointerMove);
            thumb.addEventListener('pointerup', onPointerUp);
            thumb.addEventListener('pointercancel', onPointerUp);
        };

        const syncWindowAfterThumbJump = async () => {
            currentPage.value = calcCurrentPage();
            await refreshData();
            await nextTick();
            updateDataScrollTop();
            updateDataTransform();
        };

        const globalFromThumbTop = (thumbTop: number) =>
            maxThumb.value === 0 ? 0 : clampGlobalPosition((thumbTop / maxThumb.value) * maxMathScroll.value);

        const onTrackPointerDown = async (event: PointerEvent) => {
            if (virtualScrollTools?.isPageLoading.value) return;
            if (event.target === scrollbarThumb.value) return;
            event.preventDefault();

            const trackRect = scrollbarTrack.value.getBoundingClientRect();
            const clickY = event.clientY - trackRect.top;

            const nextThumbTop = clampThumb(clickY - thumbHeightPx.value / 2);
            globalPosition.value = globalFromThumbTop(nextThumbTop);

            updateThumb();
            await syncWindowAfterThumbJump();
        };

        const createDataContainerObserver = () => {
            dataContainerObserver = new ResizeObserver(() => {
                const nextHeight = scrollbarContainer.value?.clientHeight ?? 0;
                if (nextHeight === scrollbarContainerHeight.value) return;

                scrollbarContainerHeight.value = nextHeight;
                scrollbarThumb.value.style.height = `${thumbHeightPx.value}px`;
                globalPosition.value = clampGlobalPosition(globalPosition.value);

                updateDataScrollTop();
                updateThumb();
                updateDataTransform();
            });
        };

        if (!scrollbarContainer.value) throw new Error('Scrollbar container not found');
        createDataContainerObserver();
        if (!dataContainerObserver) throw new Error('Data container observer not found');
        dataContainerObserver.observe(scrollbarContainer.value);
        scrollbarContainer.value.addEventListener('wheel', onWheel, { passive: false, signal });
        scrollbarThumb.value.addEventListener('pointerdown', onThumbPointerDown, { signal });
        scrollbarTrack.value.addEventListener('pointerdown', onTrackPointerDown, { signal });

        return scrollbarTrack;
    };

    const init = async (
        dataTableRef: Ref<InstanceType<typeof NDataTable> | null>,
        incomingPageSize: number,
        incomingCellHeight: number,
        getVirtualScrollTools: (incomingPageSize: number) => VirtualScrollTools
    ) => {
        await initState(dataTableRef, incomingPageSize, incomingCellHeight, getVirtualScrollTools);
        removeScrollbarRail();
        initScrollbarContainer();
        initDataContainer();
        createScrollbarTrack();
        createScrollbarThumb();
        createScrollbar();

        return true;
    };

    const refreshData = async () => {
        const dataLength = virtualScrollTools?.getDataLength();
        if (!dataLength) throw new Error('Data length not found');

        let skip = 0;
        let take = 0;

        if (isFirstPage.value) {
            skip = 0;
            take = 2 * pageSize.value;
        } else if (isLastPage.value) {
            skip = (currentPage.value - 3) * pageSize.value;
            take = 3 * pageSize.value;
        } else {
            skip = (currentPage.value - 2) * pageSize.value;
            take = 3 * pageSize.value;
        }

        const response = await virtualScrollTools?.getData(skip, take, true);
        if (!response?.result) return false;
        totalCount.value = response.totalCount;

        virtualScrollTools?.removeDataFromTop(dataLength);
        return true;
    };

    const clear = () => {
        dataContainerObserver?.disconnect();
        abortController.abort();
    };

    return {
        totalCount,
        init,
        refreshData,
        clear,
    };
};
