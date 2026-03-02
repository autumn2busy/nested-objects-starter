const modules = [
    { id: '1', module_number: 1, title: 'Mod 1' },
    { id: '2', module_number: 2, title: 'Mod 2' },
    { id: '3', module_number: 3, title: 'Mod 3' },
    { id: '4', module_number: 4, title: 'Mod 4' },
    { id: '5', module_number: 5, title: 'Mod 5' },
    { id: '6', module_number: 6, title: 'Mod 6' },
    { id: '7', module_number: 7, title: 'Mod 7' },
    { id: '8', module_number: 8, title: 'Mod 8' },
];

const passedModuleIds = new Set(['1', '2', '3', '4', '5']);

const sortedModules = [...modules].sort((a, b) => a.module_number - b.module_number);

const isModuleUnlocked = (module, index) => {
    if (index === 0) return true;
    const previousModule = sortedModules[index - 1];
    if (!previousModule) return true;
    const hasPassed = Array.from(passedModuleIds).includes(previousModule.id);
    return hasPassed;
};

const getModuleStatus = (module, index) => {
    if (Array.from(passedModuleIds).includes(module.id)) return 'completed';
    if (!isModuleUnlocked(module, index)) return 'locked-progress';
    return 'available';
};

modules.forEach((m, i) => {
    console.log(`Module ${m.module_number}: ${getModuleStatus(m, i)}`);
});
