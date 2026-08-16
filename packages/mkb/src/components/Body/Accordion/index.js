import React, {useEffect, useRef, useState, useContext} from 'react';
import style from './index.module.css';
import {linkNames} from "../../../config";
import LinkNav from "../../LinkNav/LinkNav";
import {idKey} from "../../../utilites/idKey";
import { AccordionIcon } from '../../img/AccordionIcon'
import {Link, useLocation} from "react-router-dom";
import {coordinationActions} from "../../../modules/Main/reducers/coordination";
import {href} from "../../../utilites/Icd-11";
import {tocActions} from "../../../modules/Main/reducers/tableOfContent";
import Arrow from "../../img/Arrow/Arrow";
import FilterMenu from "../../DiagnosisCoding/FilterMenu";
import isEmpty from "../../../utilites/isEmpty";
import { UserContext } from '@src/App';

export const Accordion = ({className, selectOption, option}) => {
	className = (className) ? className : {}
	const location = useLocation();
	const [isNavExpanded, setIsNavExpanded] = useState(false)
	const menuitem = useRef(null)
	const {userInfo} = useContext(UserContext);

	useEffect(() => {
		setIsNavExpanded(false)
	}, [location])

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuitem.current && !menuitem.current.contains(event.target)) {
				let data = event.target
				let isData = true
				for(let i =0 ; i < 4; i++) {
					if(data.tagName === 'svg' || data.tagName === 'path') {
						data = data.parentNode
						if(data.classList.contains('icon_wrapper')) {
							isData = false
							break
						}
					}
				}

				if(isData) {
					setIsNavExpanded(false);
				}
			}
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [menuitem]);

	return (
		<>
			<div
				onClick={() => setIsNavExpanded(!isNavExpanded)}
				className={`icon_wrapper ${className.icon_wrapper}`}
			>
				<AccordionIcon />
			</div>
			{isNavExpanded &&
				<div
					ref={menuitem}
					className={`${className.nav_wrapper}`}
				>
					{linkNames.map(item => {
						return (
							<React.Fragment key={idKey()}>
								{!isEmpty(item.chapter) ? (
									<div className={`link__navigation ${className.link__navigation}`}>
										{item.name}
										<div className={`link__navigation_chapters ${className.link__navigation_chapters}`}>
											{item.chapter.map(item => {
												return (
													<Link
														key={idKey()}
														to={ item.link }
														className={`link__navigation_chapter ${className.link__navigation_chapter}`}
													>
														{ item.name }
													</Link>)
											})}
										</div>
									</div>
								): (<>
									{!!item.isAuth && userInfo !== null ? (
										userInfo.roles.some(item => item === 'mkb_admin')
											? (<LinkNav
												className={className}
												key={ idKey() }
												name={ item.name }
												link={ item.link }
											/>)
											: ('')
									): ('')}
									{!item.isAuth &&
										<LinkNav
											className={className}
											key={ idKey() }
											name={ item.name }
											link={ item.link }
									/>}
								</>)}
							</React.Fragment>
					)})}
				</div>}
		</>
	);
}
