import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    GreenhouseFilterComponent,
    QuickFilterComponent,
    SearchBoxComponent
} from './';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        FormsModule,
        GreenhouseFilterComponent,
        QuickFilterComponent,
        SearchBoxComponent
    ],
    exports: [
        GreenhouseFilterComponent,
        QuickFilterComponent,
        SearchBoxComponent
    ]
})
export class FilterModule { }