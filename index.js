const fs = require('fs');
const http = require('http');
const url = require('url');

let files = ['example.txt','example2.txt','log_file.txt'];

fs.watch('./Log_files/').on('change',(e,filename)=>{
    files.push(filename);
    console.log(files);
});

const server = http.createServer((req,res)=>{
    
    const timestamp_ = url.parse(req.url,true).query;
    if(req.url.split('?')[0] == '/api/search')
    {
        const valid_timestamp = new Date(timestamp_.timestamp);
        if(Date.parse(valid_timestamp))
        {
            res.writeHead(200,{'Content-Type':'application/json'});

            files.map((path)=>{
                const readableStream = fs.createReadStream(__dirname + '/Log_files/'+path,{encoding:'utf-8'});
                readableStream.on('data',data=>{
                    readableStream.pause();
                    const data_to_string = data.toString();
                    const data_split = data_to_string.split('\n');
                    const last_data_timestamp = new Date(data_split[data_split.length-2].split(' ')[0]);
                    const first_data_timestamp = new Date(data_split[1].split(' ')[0]);
                    if(valid_timestamp < last_data_timestamp && valid_timestamp > first_data_timestamp)
                    {
                        readableStream.setMaxListeners(Infinity);
                        let result = Object.assign({},Process_data(data_split,2,data_split.length-2,valid_timestamp));
                        res.write(JSON.stringify(result));
                        readableStream.on('end',()=>{res.end();})
                    }
                    readableStream.resume();
                });
            });

        }else
        {
            res.writeHead(400);
            res.write("Wrong Timestamp Format !");
            res.end();
        }
    }else
    {
        res.writeHead(404);
        res.write("Page Not Found !");
        res.end();
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>{
    console.log('Server Running...');
});

function Process_data(data,low,high,target)
{
    const res_array = [];
    let mid = Math.floor((low + high)/2);
    let current_element_timestamp = new Date(data[mid].split(' ')[0]);
    while(low <= high && mid != low || mid != high)
    {
        if(current_element_timestamp.getTime() === target.getTime())
        {
            return {code:1,result:data[mid]};
        }
        if(current_element_timestamp < target)
        {
            low = mid + 1;
        }
        if(current_element_timestamp > target)
        {
            high = mid - 1;
        }
        mid = Math.floor((low + high)/2);
        current_element_timestamp = new Date(data[mid].split(' ')[0]);
        if(current_element_timestamp.getTime() === target.getTime())
        {
            return {code:1,result:data[mid]};
        }
        res_array.push(data[mid]);
    }
    return {code:0,result:res_array};
}

