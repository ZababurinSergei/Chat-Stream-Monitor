import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'roleText',
    standalone: true
})
export class RoleTextPipe implements PipeTransform {
    transform(role: string): string {
        const roleMap: Record<string, string> = {
            'specialist': 'Специалист',
            'senior-specialist': 'Старший специалист'
        };
        return roleMap[role] || role;
    }
}