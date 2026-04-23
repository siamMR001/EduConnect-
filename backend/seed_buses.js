const mongoose = require('mongoose');
require('dotenv').config();
const EmployeeID = require('./models/EmployeeID');
const BusRoute = require('./models/BusRoute');

async function seedBuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Clear existing BusRoutes
        await BusRoute.deleteMany();

        // 2. Create standard routes targeting EduConnect Campus (Badda)
        // Let's assume Badda Campus is at 23.7805, 90.4267
        const routes = [
            {
                routeName: 'Route A - Uttara to Badda',
                startName: 'Uttara (Azampur)',
                startLat: 23.8644,
                startLng: 90.4002,
                destName: 'Badda Campus',
                destLat: 23.7805,
                destLng: 90.4267,
                departureTime: '07:00 AM',
                reachingTime: '08:15 AM'
            },
            {
                routeName: 'Route B - Dhanmondi to Badda',
                startName: 'Dhanmondi 27',
                startLat: 23.7548,
                startLng: 90.3768,
                destName: 'Badda Campus',
                destLat: 23.7805,
                destLng: 90.4267,
                departureTime: '07:15 AM',
                reachingTime: '08:20 AM'
            },
            {
                routeName: 'Route C - Mirpur to Badda',
                startName: 'Mirpur 10',
                startLat: 23.8069,
                startLng: 90.3687,
                destName: 'Badda Campus',
                destLat: 23.7805,
                destLng: 90.4267,
                departureTime: '07:10 AM',
                reachingTime: '08:15 AM'
            }
        ];

        await BusRoute.insertMany(routes);
        console.log('Created 3 Fixed Bus Routes.');

        // 3. Create 3 additional drivers
        const newDrivers = [
            { id: 'EMP-BUS-02', first: 'Jamal', last: 'Hossain' },
            { id: 'EMP-BUS-03', first: 'Rahim', last: 'Uddin' },
            { id: 'EMP-BUS-04', first: 'Karim', last: 'Ali' }
        ];

        for (const driver of newDrivers) {
            let employee = await EmployeeID.findOne({ employeeId: driver.id });
            if (!employee) {
                await EmployeeID.create({
                    employeeId: driver.id,
                    firstName: driver.first,
                    lastName: driver.last,
                    employeeType: 'employee',
                    status: 'pending',
                    generatedAt: new Date()
                });
                console.log(`Created EmployeeID for ${driver.id}`);
            } else {
                employee.employeeType = 'employee';
                employee.status = 'pending';
                employee.user = undefined;
                await employee.save();
                console.log(`Reset ${driver.id}`);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seedBuses();
