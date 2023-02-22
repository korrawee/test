import { BadRequestException, Injectable } from '@nestjs/common';
import { dbResponse } from 'src/db/db.response.type';
import { ShiftforDashboardDto } from './dto/ShiftForDashboard.dto';
import { ShiftforDashboardAttrDto } from './dto/ShiftForDashboardAttr.dto';
import { ShiftInDepartmentDto } from './dto/ShiftInDepartment.dto';
import { Client } from 'pg';
import { InjectClient } from 'nest-postgres';
import { UpdateShiftDto } from './dto/UpdateShift.dto';
import { ShiftDto } from './dto/Shift.dto';
const moment = require('moment');

@Injectable()
export class ShiftService {
    constructor(@InjectClient() private readonly cnn: Client){}

    async getShiftsById(departmentsId: string[]){

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
                            SELECT shift_code,
                                success_product,
                                all_member,
                                checkin_member,
                                shift_time,
                                date
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
                        shiftDate: shift.date,
                        shiftTime: shift.shift_time,
                        successProduct: shift.success_product,
                        allMember: shift.all_member,
                        checkInMember: shift.checkin_member,
                    }

                    return res;
                })
                .catch((error) => {

                    console.error(error);
                    throw new BadRequestException('Invalid input data');
                });

            return shift;
        })).then(res=>{
            
            return res;
        });

        return data.then((res)=>(res.pop()));
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

    public async getShiftById(shiftCode: string){
        const query = `
            SELECT *
            FROM shifts
            WHERE shift_code='${shiftCode}'
            ;
        `;

        const shift: ShiftDto = await this.cnn.query(query)
            .then((res: dbResponse)=>{
                return res.rows.pop();
            })
            .catch(e=>{
                console.log(e);
                throw new BadRequestException('Invalid input Data');
            })
        return shift;
    }

    public async updateShift(body: UpdateShiftDto){
        const lastIndexCol = Object.keys(body).length - 1;
        const columns = Object.keys(body).reduce((str, col, currentIndex)=>{
            return str + ((currentIndex == lastIndexCol) ? col:col + ',') ;
        },'');
        
        const lastIndexVal = Object.values(body).length - 1;
        const values = Object.values(body).reduce((str, val, currentIndex)=>{
            if(typeof(val) === 'string'){
                val = `'${val}'`;
            }else if(typeof(val) === 'object'){
                // const d = new Date(val);
                // val = `'${d.getFullYear()}-${d.getMonth()}-${d.getDate()}'`;
                val = moment(val).format("'YYYY-MM-DD'");
                console.log(val);
            }else{
                
            }
            return str + ((currentIndex == lastIndexVal) ? val:val + ',') ;
        },'');
        
        const query = `
            UPDATE shifts
            SET (${columns}) = (${values})
            WHERE shift_code='${body.shift_code}'
            RETURNING *
        ;`;
        console.log(query);
        
        const shift = await this.cnn.query(query)
        .then((res: dbResponse)=>{
                return res.rows.pop();
            })
            .catch(e=>{
                console.log(e);
                throw new BadRequestException('Invalid input Data');
            })
        
        return shift; 
    }
}
