const CustomeSelectArray = (data = [], idKey = 'id', nameKey = 'name') => {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array');
    }

    return data.map((item) => ({
        id: item[idKey],
        name: item[nameKey]
    }));
};

export default CustomeSelectArray;
