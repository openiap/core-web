import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { driver, type DriveStep } from "driver.js";
export const driverObj = driver({
    showProgress: true,
    stagePadding: 0,
    onDestroyed: () => {
        // @ts-ignore
        document?.activeElement?.blur();
    }
});
export const baseTour: DriveStep[] = [
    {
        popover: {
            title: 'OpenCore',
            description: 'Welcome to OpenCore! This is a quick tour to help you get started. Use arrow keys or click the Next button to navigate.',
        },
    },
    {
        element: '.toursidebar',
        popover: {
            title: 'OpenCore',
            description: 'You can find most actions in the side menu, like managing agents, packages, and settings.',
            onNextClick: () => {
                goto(base + '/workitem');
                driverObj.moveNext();
            },
        },
    },
    {
        element: '.tourcontent',
        popover: {
            side: "over",
            title: 'OpenCore',
            description: 'Press ? on the keyboard or the top menu to start a guided tour for that part of the system.',
            onPrevClick: () => {
                goto(base + '/');
                driverObj.movePrevious();
            },
            onNextClick: () => {
                goto(base + '/');
                driverObj.moveNext();
            },
        },
    },
    {
        element: '.tourcontent',
        popover: {
            side: "over",
            title: 'OpenCore',
            description: 'Many menu items also have a keyboard shortcut, for instance you can press "g" and then "e" to jump to the Entities page.',
            onPrevClick: () => {
                goto(base + '/workitem');
                driverObj.movePrevious();
            }
        },
    },
]
    ;
export const agentTour: DriveStep[] = [
    {
        element: '.touragents',
        popover: {
            title: 'Manage agents.',
            description: 'Click here to Manage agents. this is also where you can create cloud agents. Agents are used to run the code you publish to OpenCore.',
            onNextClick: () => {
                goto(base + '/agent');
                driverObj.moveNext();
            },
            onPrevClick: () => {
                goto(base + '/');
                driverObj.movePrevious();
            }
        },
    },
    {
        element: '.tourcontent',
        popover: {
            side: "over",
            title: 'Manage agents.',
            description: 'Agents can run both externaly, on your own infrastructure, or in the cloud. You can create cloud agents by clicking the "Add Agent" button.',
        },
    },
    {
        element: '.touraddagent',
        popover: {
            title: 'Manage agents.',
            description: 'Agent images are pre-configured environments that you can use to run your code, like node.js, python, rust. You can also find images for popular frameworks like dotnet and powershell. We even have images that comes preloaded applications like the low-code workflow engine NodeRED.',
            onNextClick: () => {
                goto(base + '/agent/new');
                driverObj.moveNext();
            },
        },
    },
    {
        element: '.tourcontent',
        popover: {
            side: "over",
            title: 'Manage agents,',
            description: 'When managing agents, you can see the status of each agent, schedule packages and view container logs. If resource broker has been enabled, you can also select a plan that matches the requirements for your agent, some agent may need more RAM or CPU power to run effeicently.',
            onPrevClick: () => {
                goto(base + '/agent');
                driverObj.movePrevious();
            },
            onNextClick: () => {
                goto(base + '/');
                driverObj.moveNext();
            },

        }
    }
];
export const entitiesTour: DriveStep[] = [
    {
        popover: {
            title: 'Entities',
            description: 'This is where you can manage all data saved inside OpenCore. Entities are like tables in a database, you can create, read, update and delete data here.',
        },
    },
    {
        element: '.tourcontent',
        popover: {
            side: "over",
            title: 'Entities',
            description: 'You can select a collection in sidebar, or use the up and down key to cycle though them. Press "n" to create a new entity in the current collection.',
        },
    },
    {
        element: '.tourcontent',
        popover: {
            side: "over",
            title: 'Entities',
            description: `Unlike most other databases, you can set finegrained permissions on who can access and modify any piece of data in the database.`,
            onNextClick: () => {
                goto(base + '/entities/new');
                driverObj.moveNext();
            },
        },
    },
    {
        element: '.tourcontent',
        popover: {
            side: "over",
            title: 'Entities',
            description: 'Data is saved as JSON, which means you can store complex data structures, like arrays and objects, in a single field. We you can search any field in the database, and for large collections we can manage indexes for performance.',
            onPrevClick: () => {
                goto(base + '/entities/entities');
                driverObj.movePrevious();
            },
        },
    }
];

