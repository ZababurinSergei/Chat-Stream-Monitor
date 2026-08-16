import React from 'react';
import './FilterMenu.style.css';
import FilterMenuItem from '../FilterMenuItem';
import { idKey } from '../../../utilites/idKey';

function FilterMenu({ selectOption, filterCategories, className }) {
    className = (className) ? className : {}
    return (
        <>
            <div
              className={`filter-menu__wrapper ${className['filter-menu__wrapper']}`}
            >
                {filterCategories && filterCategories.map(item => (
                    <div
                        key={idKey()}
                        className={`filter-menu__item ${className['filter-menu__item']}`}
                    >
                        <FilterMenuItem
                            className={className}
                            title={ item.name }
                            selectOption={ selectOption }
                            object={item}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

export default FilterMenu;
