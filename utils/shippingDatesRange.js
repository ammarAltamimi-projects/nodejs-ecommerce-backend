exports.getShippingDatesRange = (minDays,maxDays,date)=>{

    const getData = new Date(date)
    const minDate = new Date(getData)
    minDate.setDate(getData.getDate() + minDays)
    const maxDate = new Date(getData)
    maxDate.setDate(getData.getDate() + maxDays)

    return {
        minDate:minDate.toDateString() ,
        maxDate :maxDate.toDateString()
    }
}