import React, { ReactNode } from 'react'



type ListProps<T> = {
    loadingLabel: string,
    renderItem: (inp: T) => ReactNode,
    items: T[],
    isFetching: boolean,
    onLoadMoreClick: () => any,
    nextPage?: number
};

const List: React.FC<ListProps<any>> = ({
    loadingLabel, renderItem, items, isFetching, onLoadMoreClick, nextPage
}) => {

    const isEmpty = items.length === 0
    if (isEmpty && isFetching) {
        return <h2><i>{loadingLabel}</i></h2>
    }
    const isLastPage = nextPage === undefined ? true : false
    if (isEmpty && isLastPage) {
        return <h1>Nothing here</h1>
    }
    const renderLoadMore = () => {
        console.log("********** isFetching : ", isFetching);
        return (
            <button style={{ fontSize: "50%" }} onClick={onLoadMoreClick} disabled={isFetching}>
                {isFetching ? "Loading ..." : "Load More"}
            </button>
        )
    }
    console.log("isLastPage : ", isLastPage, "nextPage ", nextPage);
    return (
        <div>
            {items.map(renderItem)}
            {(nextPage !== undefined) && !isLastPage && renderLoadMore()}
        </div>);
}

export default List;