import { BadRequestException, ConsoleLogger, Injectable } from '@nestjs/common';
import { dbResponse } from 'src/db/db.response.type';
import { ShiftforDashboardDto } from './dto/ShiftForDashboard.dto';
import { ShiftforDashboardAttrDto } from './dto/ShiftForDashboardAttr.dto';
import { ShiftInDepartmentDto } from './dto/ShiftInDepartment.dto';
import { Client } from 'pg';
import { InjectClient } from 'nest-postgres';
import { RequestDto } from 'src/relations/request/dto/Request.dto';
import moment = require('moment');

@Injectable()
export class ShiftService {
    constructor(@InjectClient() private readonly cnn: Client){}

    async getShiftsById(departmentsId: string[]){
        console.log('in getshiftByID')
        const result: Promise<ShiftforDashboardDto[]> = Promise.all(departmentsId.map(async (departmentId: string)=>{

            const query: string = `select shift_code from _controls where department_id='${departmentId}'`;

            const shiftInDepartment: ShiftforDashboardDto = await this.cnn.query(query)

            .then(async (res: dbResponse) => {
                console.log(await this.getshifts(res.rows).then((res)=>(res)));
                return await this.getshifts(res.rows).then((res)=>(res));
            })
            .catch((error) => {
                console.error(error);
                throw new BadRequestException('Invalid input data');
            });
            return shiftInDepartment;
        }));
        
        console.log(await result);
        return await result;
    }

    public async getshifts(shiftInDepartment: ShiftInDepartmentDto[]) {
        const data: Promise<ShiftforDashboardDto[]> = Promise.all(shiftInDepartment.map(async (obj: ShiftInDepartmentDto) => {
        // return Promise.all(shiftInDepartment.map(async (obj: ShiftInDepartmentDto) => {
            const query = `
                            SELECT *
                            FROM shifts 
                            WHERE shift_code='${+obj.shift_code}'
                        `
            const shift =  await this.cnn.query(query)
                .then((res: dbResponse) => {
                    
                    return res.rows.pop();
                })
                .then((shift: ShiftforDashboardAttrDto) => {
                    const res: ShiftforDashboardDto = {
                        shiftCode: shift.shift_code,
                        shiftDate: moment(shift.date).format('DD/MM/YYYY'),
                        shiftTime: shift.shift_time,
                        successProduct: shift.success_product,
                        allMember: shift.all_member,
                        checkInMember: shift.checkin_member,
                        idealPerformance: shift.ideal_performance
                    }

                    return res;
                })
                .catch((error) => {

                    console.error(error);
                    throw new BadRequestException('Invalid input data');
                });

            return shift;
        }))
        // .then(res=>{
            
        //     return res;
        // });

        return data.then((res)=>(res));
    }

    public async getShiftTimeById(shiftCode: string){
        const query = `
            SELECT shift_time
            FROM shifts 
            WHERE shift_code='${shiftCode}';
        `;
        // console.log('shift_code: ', shiftCode)
        const requestWithWorkTime: {shift_time: string} = await this.cnn.query(query)
            .then((res: dbResponse)=>{
                // console.log('shift',res.rows)
                return res.rows.pop();
            })
            .catch(e=>{
                console.log(e);
                throw new BadRequestException('Invalid input Data');
            })
        
            return requestWithWorkTime;
    }
}
