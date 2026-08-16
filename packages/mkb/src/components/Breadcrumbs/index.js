import useBreadcrumbs from "use-react-router-breadcrumbs";
import {Link} from "react-router-dom";
import React, {useEffect} from "react";
import {idKey} from "../../utilites/idKey";
import routes from '../../modules'
import isEmpty from '../../utilites/isEmpty'
import style from './index.module.css'
import analytics from '../../utilites/analytics'
import { useLocalStorage } from '@src/hooks/useLocalStorage';

export const Breadcrumbs = (props) => {
    const className = props.className ? props.className : {}
    const breadcrumbs = useBreadcrumbs(routes);
    return (
        <div className={`${className.style__Breadcrumbs_container} ${style.container}`}>
            {breadcrumbs.map(({ match, breadcrumb }) => {
                if(!isEmpty(match.params['*']) && breadcrumb.props.children === "МКБ-11") {
                    if(breadcrumbs.length === 4) {
                        let object = match.params['*'].split('/')
                        return (
                            <Link key={idKey()} to={match.pathname}>
                                /{object[object.length - 1]}
                            </Link>
                        )
                    }

                    return (
                        <Link key={idKey()} to={match.pathname}>
                             /{match.params['*']}
                         </Link>
                    )
                } else {
                    if(breadcrumbs.length === 2) {
                        if(breadcrumb.key !== '/testing') {
                            return (
                                <Link key={idKey()} to={breadcrumb.key}>
                                    {breadcrumb.key === '/' ? (<>
                                        {breadcrumb}/МКБ11
                                    </>) :(<>
                                        /{breadcrumb}
                                    </>)}
                                </Link>
                            )
                        }
                    } else if(breadcrumbs.length === 3) {
                        if(breadcrumb.key !== '/testing') {
                            return (
                                <Link key={idKey()} to={breadcrumb.key}>
                                    {breadcrumb.key === '/' ? (<>
                                        {breadcrumb}/МКБ11
                                    </>) :(<>
                                        /{breadcrumb}
                                    </>)}
                                </Link>
                            )
                        }
                    }
                    return (
                        <Link key={idKey()} to={breadcrumb.key}>
                            {breadcrumb.key === '/' && <>{breadcrumb}/МКБ11</>}
                        </Link>
                    )
                }

            })}
        </div>
    );
};